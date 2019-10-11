const mongoose = require("mongoose");
const Schema   = mongoose.Schema;

const librarySchema = new Schema({
  title: String,
  subtitle: String,
  description: String,
  admin: {type: Schema.Types.ObjectID, ref:`User`},
  users: [{type: Schema.Types.ObjectID, ref:`User`}],
  books: [{type: Schema.Types.ObjectID, ref:`Book`}],
  comments: Array,
  countUsers: {type: Number, default: 0}
});

const Library = mongoose.model("Library", librarySchema);
module.exports = Library;