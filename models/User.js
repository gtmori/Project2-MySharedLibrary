const mongoose = require("mongoose");
const Schema   = mongoose.Schema;

const userSchema = new Schema({
  name: String,
  username: String,
  password: String,
  imgPath: {type: String, default: "https://res.cloudinary.com/gtmori/image/upload/v1570799962/SharedLibrary/Pngtree_user_icon_member_login_vector_4972686_ncutsm.jpg"},
  imgName: {type: String, default: "user icon"},
  adress: String,
  library: [{type: Schema.Types.ObjectID, ref:`Library`}]
});

const User = mongoose.model("User", userSchema);
module.exports = User;