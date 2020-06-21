const mongo = require("mongoose");

const pollsSchema = new mongo.Schema({
  _id: mongo.Schema.Types.ObjectId,
  poll_type: String,
  reference_id: String,
  created_by: String,
  is_private: Boolean,
  poll_results: Object
});

module.exports = mongo.model("Polls", pollsSchema);
