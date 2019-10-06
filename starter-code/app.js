// =====================================================================================================================================
// Packages and Models require 
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const session = require("express-session");
const path = require("path");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const MongoStore = require("connect-mongo")(session);
const http = require('http');
const bodyParser = require('body-parser');
const flash = require("connect-flash")

// =====================================================================================================================================
// Call bodyparser
app.use(bodyParser.urlencoded({ extended: true }));

// =====================================================================================================================================
// Connection with database
mongoose
  .connect('mongodb://localhost/SharedLibrary', {useNewUrlParser: true, useUnifiedTopology: true})
  .then(x => console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`))
  .catch(err => console.error('Error connecting to mongo', err));

// =====================================================================================================================================
// Express View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// =====================================================================================================================================
// Configure a session
app.use(session({
  secret: "sharedlibrary3021",
  cookie: { maxAge: 60000 },
  resave: true,
  saveUninitialized: true,
  store: new MongoStore({
    mongooseConnection: mongoose.connection,
    ttl: 24 * 60 * 60 // 1 day
  })
}));

// =====================================================================================================================================
// Passport configuration
passport.serializeUser((user, cb) => {
  cb(null, user._id);
});

passport.deserializeUser((id, cb) => {
  User.findById(id, (err, user) => {
    if (err) { return cb(err); }
    cb(null, user);
  });
});

passport.use(new LocalStrategy((email, password, next) => {
  User.findOne({ email }, (err, user) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return next(null, false, { message: "Incorrect email" });
    }
    if (!bcrypt.compareSync(password, user.password)) {
      return next(null, false, { message: "Incorrect password" });
    }

    return next(null, user);
  });
}));

// =====================================================================================================================================
// Initializate passport an passport session
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());


// =====================================================================================================================================
// Call the routes
const auth = require('./routes/auth');
app.use('/', auth);

const router = require('./routes/index');
app.use('/', router);

// =====================================================================================================================================
//Create a server


module.exports = app;