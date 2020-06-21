const mongo = require("mongoose");

const imagePollsSchema = new mongo.Schema({
  _id: mongo.Schema.Types.ObjectId,
  question: Object,
  options: Object
});

module.exports = mongo.model("Image_Polls", imagePollsSchema);
