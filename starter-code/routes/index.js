// =====================================================================================================================================
// Packages and Models require 
const express = require('express');
const router  = express.Router();
const Library = require(`../models/Library`)
const User = require(`../models/User`)

// =====================================================================================================================================
// Middlewares
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/login')
  }
}

// =====================================================================================================================================
/* GET home page */
router.get('/', (req, res, next) => {
  res.render('index');
});

// =====================================================================================================================================
// New Library
router.get('/new-library', ensureAuthenticated, (req, res, next) => {
  res.render('new-library', {user: req.user})
});

router.post('/new-library', ensureAuthenticated, (req, res, next) => {
  const { title, description } = req.body;

  console.log( req.user );
  
  
  if (title === "") {
    res.render("auth/signup", { message: "Indicate title" });
    return;
  }

  const newLibrary = new Library ({
    title,
    description,
    users: req.user
  })

  newLibrary.save((err) => {
    if (err) { return next(err); }
    else {
      User.findByIdAndUpdate(req.user._id, {$push: {library: newLibrary}})
      .then(
        res.redirect('/'))
      .catch(err => console.log(err))
    }
  })
});

// =====================================================================================================================================
// Book detail

router.get('/details', (req, res, next) => {
  res.render(`book-detail`, req.body)
})



module.exports = router;
