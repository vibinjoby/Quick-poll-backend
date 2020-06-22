const mongo = require("mongoose");

const textPollsSchema = new mongo.Schema({
  question: String,
  options: Object
});

module.exports = mongo.model("Text_Polls", textPollsSchema);
