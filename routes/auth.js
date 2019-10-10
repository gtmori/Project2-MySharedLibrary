// =====================================================================================================================================
// Packages and Models require 
const express = require("express");
const auth = express.Router();
const User = require("../models/User")
const passport = require("passport");
const uploadCloud = require('../config/cloudinary.js');
const multer  = require('multer');

// =====================================================================================================================================
// bcrypt require and to encrypt passwords
const bcrypt = require("bcrypt");
const bcryptSalt = 10;

// =====================================================================================================================================
// Home page
auth.get('/', (req, res, next) => {
  res.render('index');
});

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

// =====================================================================================================================================
// Edit-profile
auth.get("/edit-profile", (req, res, next) => {
  User.findById(req.user._id)
  .then(user => res.render('edit-profile', {user}))
  .catch(err => console.log(err))
})

auth.post("/edit-profile", uploadCloud.single('picture'), (req, res, next) => {
  const { name, username, adress } = req.body
  const imgPath = req.file.url;
  const imgName = req.file.originalname;
  User.findById(req.user._id)
    .then(user => {
      User.findByIdAndUpdate(req.user._id,{name, username, adress, imgPath, imgName})
      .then(res.redirect('/libraries', { user }))
      .catch(err => console.log(err))
    })
    .catch(err => console.log(err))
})

module.exports = auth;