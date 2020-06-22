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
  console.log(result);
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
  const result = await Polls.find();
  //text polls
  const filteredTextPolls = result.filter(p => p.poll_type === "text");
  for (let polls of filteredTextPolls) {
    const textPolls = await TextPolls.findOne({ _id: polls.reference_id });
    allPolls.push(textPolls);
  }
  return allPolls;
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
  }
  return pollObj;
}

/**
 *
 * @param {*} userId
 */
async function getUserPolls(userId) {
  let pollsObj = [];
  const polls = await Polls.find({
    created_by: userId
  });

  for (let poll of polls) {
    //image poll to be added later
    poll.poll_type === "text"
      ? pollsObj.push(await fetchTextPolls(poll.reference_id))
      : "";
  }
  return pollsObj;
}

/**
 *
 * @param {*} textId
 */
async function fetchTextPolls(textId) {
  const textPolls = TextPolls.findById(textId);
  return textPolls;
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
async function createPoll(pollType, imagePollsOutput, userId) {
  const polls = await Polls.create({
    poll_type: pollType,
    reference_id: imagePollsOutput._id,
    created_by: userId
  });
  const pollsOutput = await polls.save();
  console.log(`Entry created in polls collection with id ${pollsOutput._id}`);
}

/**
 * Function to save image polls when options is an image
 * @param {*} userId
 * @param {*} optionsUrl
 * @param {*} question_text
 */
async function addPollOptionsImg(userId, optionsUrl, question_text) {
  const is_options_image = "Y";

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
  createTextPoll
};
