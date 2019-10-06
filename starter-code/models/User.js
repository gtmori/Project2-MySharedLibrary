const mongoose = require("mongoose");
const Schema   = mongoose.Schema;

const userSchema = new Schema({
  name: String,
  email: String,
  password: String,
  picture: String,
  adress: String,
  library: [{type: Schema.Types.ObjectID, ref:`Library`}]
});

const User = mongoose.model("User", userSchema);
module.exports = User;