// =====================================================================================================================================
// Packages and Models require 
const express = require("express");
const auth = express.Router();
const User = require("../models/User")
const passport = require("passport");
const ensureLogin = require("connect-ensure-login");
// =====================================================================================================================================
// bcrypt require and to encrypt passwords
const bcrypt = require("bcrypt");
const bcryptSalt = 10;

// =====================================================================================================================================
// Signup
auth.get("/signup", (req, res, next) => {
  res.render("auth/signup");
});

auth.post("/signup", (req, res, next) => {
  console.log(req.body);
  
  const { name, email, password } = req.body;

  if (email === "" || password === "") {
    res.render("auth/signup", { message: "Indicate email and password" });
    return;
  }

  User.findOne({ email })
  .then(user => {
    if (user !== null) {
      res.render("auth/signup", { message: "The email already exists" });
      return;
    }

    const salt = bcrypt.genSaltSync(bcryptSalt);
    const hashPass = bcrypt.hashSync(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashPass
    });

    newUser.save((err) => {
      if (err) {
        res.render("auth/signup", { message: "Something went wrong" });
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
auth.get("/login", (req, res, next) => {
  res.render("auth/login");
});

auth.post("/login", passport.authenticate("local", {
  successRedirect: "/",
  failureRedirect: "/login",
  failureFlash: true,
  passReqToCallback: true
}));

// =====================================================================================================================================
// Logout
auth.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/login");
});


module.exports = auth;