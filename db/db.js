const mongo = require("mongoose");
const bcrypt = require("bcrypt");

// prod-mode
//${process.env.USERNAME}
//${process.env.PASSWORD}
const uri = `mongodb+srv://${process.env.USERNAME}:${process.env.PASSWORD}@cluster0-acs6q.mongodb.net/online_poll?retryWrites=true&w=majority`;

mongo
  .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to mongodb..."))
  .catch(err => console.log("Unable to connnect to mongodb", err));

// Load the models
const Polls = require("../models/polls");
const Users = require("../models/users");
const TextPolls = require("../models/textpoll");
const ImagePolls = require("../models/imagepoll");

/**
 *
 * @param {*} emailId
 * Check if the email already exists in mongodb
 */
async function checkEmailExists(emailId) {
  const result = await Users.find({
    email: { $regex: emailId, $options: "i" }
  });
  if (result) return true;
  return false;
}

/**
 *
 * @param {*} emailId
 * @param {*} password
 *
 * Validating the sign in credentials
 */
async function validateForSignIn(emailId, password) {
  let result = await Users.findOne({
    email: emailId
  });
  if (result) {
    const isAuthPassword = await bcrypt.compare(password, result.password);
    if (isAuthPassword) {
      result.password = undefined;
      return JSON.stringify(result);
    }
  }
  return null;
}

/**
 *
 * @param {*} body
 * Saving the user details for signing up
 */
async function createNewAccount(body) {
  const { name, email, password } = body;
  //Generate salt for hashing
  const salt = await bcrypt.genSalt(10);
  // Hash the password before saving to DB
  const hashedPwd = await bcrypt.hash(password, salt);
  const users = await Users.create({
    name,
    email,
    password: hashedPwd
  });

  await users.validate();

  await users.save();
}

/**
 * Function to fetch all the posts from db
 */
async function fetchAllPolls() {
  let allPolls = [];
  const polls = await Polls.find({ is_private: false });

  // Get the individual poll from their collection based on the id
  return Promise.all(
    polls.map(async poll => {
      if (poll.poll_type === "text") {
        let textPolls = await TextPolls.findById(poll.reference_id);
        // add a attribute to differentiate the poll type
        textPolls.poll_type = "text";
        allPolls.push(textPolls);
      } else {
        let imagePolls = await ImagePolls.findById(poll.reference_id);
        imagePolls.poll_type = "image";
        allPolls.push(imagePolls);
      }
      return allPolls;
    })
  );
}

/**
 *
 * Fetch the poll questions and options based on the id
 * @param {*} pollId
 */
async function getPollQuestion(pollId) {
  let pollObj = {};
  const result = await Polls.findOne({ reference_id: pollId });
  if (result && result.poll_type === "text") {
    pollObj = await TextPolls.findOne({ _id: result.reference_id });
  } else if (result && result.poll_type === "image") {
    //Code for handling image polls
    // :- TO-DO
  }
  return pollObj;
}

/**
 * Function to get my polls
 * @param {*} userId
 */
async function getUserPolls(userId) {
  let myPolls = [];
  const polls = await Polls.find({
    created_by: userId
  });

  return Promise.all(
    polls.map(async poll => {
      if (poll.poll_type === "text") {
        let textPolls = await TextPolls.findById(poll.reference_id);
        textPolls.no_of_votes = poll.poll_results.no_of_votes
          ? poll.poll_results.no_of_votes
          : 0;
        myPolls.push(textPolls);
      } else {
        let imagePolls = await ImagePolls.findById(poll.reference_id);
        imagePolls.no_of_votes = poll.poll_results.no_of_votes
          ? poll.poll_results.no_of_votes
          : 0;
        myPolls.push(imagePolls);
      }
      return myPolls;
    })
  );
}

/**
 * Function to delete a poll based on the poll id parameter
 * @param {*} pollId
 */
async function deletePoll(pollId) {
  let polls = [];
  const result = await Polls.findOne({ reference_id: pollId });

  // Delete the initial poll reference
  await Polls.findOneAndDelete(pollId);
  if (result && result.poll_type === "text") {
    // Then delete the corresponding poll
    polls = await TextPolls.findOneAndDelete(result.reference_id);
  } else if (result && result.poll_type === "image") {
    // Code for handling image polls
  }
  console.log(polls);
  return polls;
}

/**
 * Function to save Image polls when the question is an image
 * @param {*} userId
 * @param {*} questionsUrl
 * @param {*} options_text
 */
async function addPollQuestionImg(userId, questionsUrl, options_text) {
  const is_question_image = "Y";

  const options_text_obj = options_text.split(",").reduce((acc, cur, i) => {
    acc[i + 1] = cur;
    return acc;
  }, {});

  const imagePolls = await ImagePolls.create({
    is_question_image,
    question_img_url: questionsUrl,
    options_text: options_text_obj
  });

  await imagePolls.validate();

  const imagePollsOutput = await imagePolls.save();

  // Create an entry in Polls Collection with the id from image poll as reference
  createPoll("image", imagePollsOutput, userId);
}

/**
 * Function to create entry in polls collection after creating a new poll
 * @param {*} pollType
 * @param {*} imagePollsOutput
 * @param {*} userId
 */
async function createPoll(pollType, pollsOutput, userId) {
  let votes_per_options = {};
  /** Assign the votes per options default as 0
      If the poll type is image and if the is_options_image is present then get keys from options_img_urls
      If the poll type is image and if the is_options_image is not present then get keys from options_text
      If the poll type is not image then it is text and hence get the keys from options 
    */

  Object.keys(
    pollType === "image"
      ? pollsOutput.is_options_image
        ? pollsOutput.options_img_urls
        : pollsOutput.options_text
      : pollsOutput.options
  ).forEach(keys => {
    votes_per_options[keys] = 0;
  });

  const polls = await Polls.create({
    poll_type: pollType,
    reference_id: pollsOutput._id,
    created_by: userId,
    is_private: false,
    poll_results: {
      no_of_votes: 0,
      votes_per_options
    }
  });
  const pollsResult = await polls.save();
  console.log(`Entry created in polls collection with id ${pollsResult._id}`);
}

/**
 * Function to save image polls when options is an image
 * @param {*} userId
 * @param {*} optionsUrl
 * @param {*} question_text
 */
async function addPollOptionsImg(userId, optionsUrl, question_text) {
  const is_options_image = "Y";

  console.log("inside");

  const options_img_urls = optionsUrl.reduce((acc, cur, i) => {
    acc[i + 1] = cur;
    return acc;
  }, {});

  const imagePolls = await ImagePolls.create({
    is_options_image,
    question_text,
    options_img_urls
  });

  const imagePollsOutput = await imagePolls.save();

  // Create an entry in Polls Collection with the id from image poll as reference
  createPoll("image", imagePollsOutput, userId);
}

/**
 * Function to create text poll
 * @param {*} userId
 * @param {*} questionsText
 * @param {*} optionsArr
 */
async function createTextPoll(userId, questionsText, optionsArr) {
  const optionsObj = optionsArr.reduce((acc, cur, i) => {
    acc[i + 1] = cur;
    return acc;
  }, {});
  const textPoll = await TextPolls.create({
    question: questionsText,
    options: optionsObj
  });

  const textPollsOutput = await textPoll.save();

  // Create an entry in Polls Collection with the id from image poll as reference
  createPoll("text", textPollsOutput, userId);

  return textPollsOutput;
}
/**
 * Function to vote for a poll
 * @param {*} pollId
 * @param {*} optionChosen
 */
async function voteForPoll(pollId, optionChosen) {
  //Increment the no_of_votes and votes_per_options count
  const pollData = await Polls.findById(pollId);
  pollData.poll_results.no_of_votes += 1;
  pollData.poll_results.votes_per_options[optionChosen] += 1;
  pollData.markModified("poll_results");

  await pollData.save();
}

async function fetchVoteResults(id) {
  const pollData = await Polls.findById(id);
  return pollData.poll_results;
}

module.exports = {
  checkEmailExists,
  validateForSignIn,
  createNewAccount,
  fetchAllPolls,
  getPollQuestion,
  getUserPolls,
  deletePoll,
  addPollQuestionImg,
  addPollOptionsImg,
  createTextPoll,
  voteForPoll,
  fetchVoteResults
};
