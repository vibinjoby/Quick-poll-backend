const mongo = require("mongoose");
const bcrypt = require("bcrypt");

// prod-mode
const uri = `mongodb+srv://${process.env.USERNAME}:${process.env.PASSWORD}@cluster0-acs6q.mongodb.net/online_poll?retryWrites=true&w=majority`;

mongo
  .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to mongodb..."))
  .catch(err => console.log("Unable to connnect to mongodb", err));

const usersSchema = new mongo.Schema({
  name: String,
  email: String,
  password: String,
  create_date: Date
});

const pollsSchema = new mongo.Schema({
  id: String,
  poll_type: String,
  reference_id: String,
  created_by: String
});

const textPollsSchema = new mongo.Schema({
  id: String,
  question: String,
  options: Object
});

const Polls = mongo.model("Polls", pollsSchema);

const Users = mongo.model("Users", usersSchema);

const TextPolls = mongo.model("Text_Polls", textPollsSchema);

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
  const salt = await bcrypt.genSalt(10);
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
  try {
    const result = await Polls.find();
    //text polls
    const filteredTextPolls = result.filter(p => p.poll_type === "text");
    for (let polls of filteredTextPolls) {
      const textPolls = await TextPolls.findOne({ _id: polls.reference_id });
      allPolls.push(textPolls);
    }
    return allPolls;
  } catch (err) {
    console.log(err.message);
  }
}

/**
 *
 * Fetch the poll questions and options based on the id
 * @param {*} pollId
 */
async function getPollQuestion(pollId) {
  let pollObj = {};
  try {
    const result = await Polls.findOne({ reference_id: pollId });
    if (result && result.poll_type === "text") {
      pollObj = await TextPolls.findOne({ _id: result.reference_id });
    } else if (result && result.poll_type === "image") {
      //Code for handling image polls
    }
    return pollObj;
  } catch (err) {
    console.log(err.message);
  }
}

/**
 *
 * @param {*} userId
 */
async function getUserPolls(userId) {
  let pollsObj = [];
  try {
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
  } catch (err) {
    console.log(err.message);
  }
}

/**
 *
 * @param {*} textId
 */
async function fetchTextPolls(textId) {
  try {
    const textPolls = TextPolls.findById(textId);
    return textPolls;
  } catch (err) {
    console.log(err.message);
  }
}

module.exports = {
  checkEmailExists,
  validateForSignIn,
  createNewAccount,
  fetchAllPolls,
  getPollQuestion,
  getUserPolls
};
