// =====================================================================================================================================
// Packages and Models require 
const express = require("express");
const auth = express.Router();
const User = require("../models/User")
const passport = require("passport");

// =====================================================================================================================================
// bcrypt require and to encrypt passwords
const bcrypt = require("bcrypt");
const bcryptSalt = 10;

// =====================================================================================================================================
// Signup

auth.post("/signup", (req, res, next) => {
  const { name, username, password } = req.body;

  if (username === "" || password === "") {
    res.render("/", { message: "Indicate email and password" });
    return;
  }

  User.findOne( { username } )
  .then(user => {
    if (user !== null) {
      res.render("/", { message: "The email already exists" });
      return;
    }

    const salt = bcrypt.genSaltSync(bcryptSalt);
    const hashPass = bcrypt.hashSync(password, salt);

    const newUser = new User({
      name,
      username,
      password: hashPass
    });

    newUser.save((err) => {
      if (err) {
        res.render("/", { message: "Something went wrong" });
      } else {
        res.redirect("/");
      }
    });
  })
  .catch(error => {
    next(error)
  })
});

// =====================================================================================================================================
// Login

auth.post("/login", passport.authenticate("local", {
  successRedirect: "/libraries",
  failureRedirect: "/",
  failureFlash: true,
  passReqToCallback: true
}));

// =====================================================================================================================================
// Logout
auth.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});


module.exports = auth;