const mongo = require("mongoose");

const usersSchema = new mongo.Schema({
  _id: mongo.Schema.Types.ObjectId,
  name: String,
  email: String,
  password: String
});

module.exports = mongo.model("Users", usersSchema);
