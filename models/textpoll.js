const mongo = require("mongoose");

const textPollsSchema = new mongo.Schema({
  _id: mongo.Schema.Types.ObjectId,
  question: String,
  options: Object
});

module.exports = mongo.model("Text_Polls", textPollsSchema);
