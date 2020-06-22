const mongo = require("mongoose");

const imagePollsSchema = new mongo.Schema({
  is_options_image: String,
  question_text: String,
  options_img_urls: Object,
  is_question_image: String,
  question_img_url: String,
  options_text: Object
});

module.exports = mongo.model("Image_Polls", imagePollsSchema);
