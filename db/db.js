const mongo = require("mongoose");

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
  reference_id: String
});

const textPollsSchema = new mongo.Schema({
  id: String,
  question: String,
  options: Object
});

const Polls = mongo.model("Polls", pollsSchema);

const Users = mongo.model("Users", usersSchema);

const TextPolls = mongo.model("Text_Polls", textPollsSchema);

console.log("DB initialized!!!");

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
  const result = await Users.findOne({
    email: emailId,
    password: password
  });
  if (result) return result.name;
  return null;
}

/**
 *
 * @param {*} body
 * Saving the user details for signing up
 */
async function createNewAccount(body) {
  try {
    const { name, email, password } = body;
    const users = await Users.create({
      name,
      email,
      password
    });

    await users.validate();

    await users.save();
  } catch (ex) {
    console.log(ex.message);
  }
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

module.exports = {
  checkEmailExists,
  validateForSignIn,
  createNewAccount,
  fetchAllPolls,
  getPollQuestion
};