const mongoose = require("mongoose");
const Schema   = mongoose.Schema;

const userSchema = new Schema({
  name: String,
  username: String,
  password: String,
  imgPath: String,
  imgName: String,
  adress: String,
  library: [{type: Schema.Types.ObjectID, ref:`Library`}]
});

const User = mongoose.model("User", userSchema);
module.exports = User;