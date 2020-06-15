const mongo = require("mongoose");

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

const Users = mongo.model("Users", usersSchema);

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

    const result = await users.save();
  } catch (ex) {
    console.log(ex.message);
  }
}

module.exports = {
  checkEmailExists,
  validateForSignIn,
  createNewAccount
};
