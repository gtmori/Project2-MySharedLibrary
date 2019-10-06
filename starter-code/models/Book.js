const mongoose = require("mongoose");
const Schema   = mongoose.Schema;

const bookSchema = new Schema({
  title: String,
  ISBN: Number,
  description: String,
  author: Array,
  image: String,
  libraryID: Number,
  bookLibraryID: Number,
  actualUserID: Number,
  waitList: Array,
  usersLog: Array,
  comments: Array,
});

const Book = mongoose.model("Book", bookSchema);
module.exports = Book;