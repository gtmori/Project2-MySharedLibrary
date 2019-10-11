const mongoose = require("mongoose");
const Schema   = mongoose.Schema;

const bookSchema = new Schema({
  title: String,
  description: String,
  author: String,
  image: String,
  libraryID: {type: Schema.Types.ObjectID, ref:`Library`},
  actualUserID: {type: Schema.Types.ObjectID, ref:`User`},
  waitList: [{type: Schema.Types.ObjectID, ref:`User`}],
  usersLog: [{type: Schema.Types.ObjectID, ref:`User`}],
  dateStart: {type: Date, default: Date.now},
  comments: Array,
  actualUserBoolean: {type: Boolean, default: false},
  publisher: String,
  publishedDate: String,
  pageCount: Number
});

const Book = mongoose.model("Book", bookSchema);
module.exports = Book;