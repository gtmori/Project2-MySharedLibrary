const mongoose = require("mongoose");
const Schema   = mongoose.Schema;

const librarySchema = new Schema({
  title: String,
  description: String,
  users: [{type: Schema.Types.ObjectID, ref:`User`}],
  books: [{type: Schema.Types.ObjectID, ref:`Book`}],
  comments: Array,
});

const Library = mongoose.model("Library", librarySchema);
module.exports = Library;