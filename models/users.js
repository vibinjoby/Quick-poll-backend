const mongo = require("mongoose");

const usersSchema = new mongo.Schema({
  name: String,
  email: String,
  password: String
});

module.exports = mongo.model("Users", usersSchema);
