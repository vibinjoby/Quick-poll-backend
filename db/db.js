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
  if (result.length > 0) return true;
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
  const result = await Users.find({
    email: emailId,
    password: password
  });
  if (result && result.length > 0) return result[0].name;
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
      const textPolls = await TextPolls.find({ _id: polls.reference_id });
      allPolls.push(textPolls[0]);
    }
    return allPolls;
  } catch (err) {
    console.log(err.message);
  }
}

module.exports = {
  checkEmailExists,
  validateForSignIn,
  createNewAccount,
  fetchAllPolls
};
