// =====================================================================================================================================
// Packages and Models require 
const express = require('express');
const router  = express.Router();
const Library = require(`../models/Library`)
const User = require(`../models/User`)
const axios = require('axios')

// =====================================================================================================================================
// Middlewares
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/')
  }
}

// =====================================================================================================================================
// Home page
router.get('/', (req, res, next) => {
  res.render('index');
});

// =====================================================================================================================================
// Login Page
router.get('/library', ensureAuthenticated, (req, res, next) => {
  console.log(req.user);
  
  User.findById(req.user._id)
    .then(user => {
      if (user.library.length === 0) {
        console.log('a');
        
        res.render('library-0')
      } else {
        console.log(user.library[0]);
        res.redirect(`/library/${user.library[0]}`)
      }
    })
})

// =====================================================================================================================================
// Library Page
router.get('/library/:id', ensureAuthenticated, (req, res, next) => {
  res.render('library');
});


// =====================================================================================================================================
// Adding new Library
router.get('/new-library', ensureAuthenticated, (req, res, next) => {
  res.render('new-library', {user: req.user})
});

router.post('/new-library', ensureAuthenticated, (req, res, next) => {
  const { title, description } = req.body;

  if (title === "") {
    res.render("/new-library", { message: "Indicate title" });
    return;
  }

  const newLibrary = new Library ({
    title,
    description,
    users: req.user._id
  })

  newLibrary.save((err) => {
    if (err) { return next(err); }
    else {
      User.findByIdAndUpdate(req.user._id, {$push: {library: newLibrary}})
      .then(
        res.redirect('/library'))
      .catch(err => console.log(err))
    }
  })
});

// =====================================================================================================================================
// Search Book from Google API - List
router.get('/search', (req, res, next) => {
  res.render('search-book')
})

router.get('/search-book', (req, res, next) => {
  const { title, author } = req.query  
  const bookTitleValue = title.trim().replace(' ', '+');
  const bookAuthorValue = author.trim().replace(' ', '+');

  if (bookTitleValue === '' && bookAuthorValue === '') {
    res.render('search-book', { message: 'Adicione um título ou um autor'})
  } else if (bookTitleValue !== '' && bookAuthorValue === '') {
    const bookValue = `intitle:${bookTitleValue}`;
    const booksAPI = axios.create( {baseURL: `https://www.googleapis.com/books/v1/volumes?q=${bookValue}`} );
    booksAPI
      .get()
      .then(bookList => {
        bookList.data.items.forEach(book => {
          book.volumeInfo.authors = book.volumeInfo.authors.join(` | `);
        })
        const { items } = bookList.data
        res.render('book-list', { items })
      })
      .catch(err => { console.log(err)});
  } else if (bookTitleValue === '' && bookAuthorValue !== '') {
    const bookValue = `inauthor:${bookAuthorValue}`;
    const booksAPI = axios.create( {baseURL: `https://www.googleapis.com/books/v1/volumes?q=${bookValue}`} );
    booksAPI
      .get()
      .then(bookList => {
        bookList.data.items.forEach(book => {
          book.volumeInfo.authors = book.volumeInfo.authors.join(` | `);
        })
        const { items } = bookList.data       
        res.render('book-list', { items })
      })
      .catch(err => { console.log(err)});
  } else {
    const bookValue = `intitle:${bookTitleValue}+inauthor:${bookAuthorValue}`;
    const booksAPI = axios.create( {baseURL: `https://www.googleapis.com/books/v1/volumes?q=${bookValue}`} );
    booksAPI
      .get()
      .then(bookList => {
        bookList.data.items.forEach(book => {
          book.volumeInfo.authors = book.volumeInfo.authors.join(` | `);
        })
        const { items } = bookList.data        
        res.render('book-list', { items })
      })
      .catch(err => { console.log(err)});
  }
})

// =====================================================================================================================================
// Search Book from Google API - Details

router.get('/book-detail/:bookID', (req, res, next) => {
  const { bookID } = req.params;
  const bookAPI = axios.create( {baseURL: `https://www.googleapis.com/books/v1/volumes/${bookID}`} );
  bookAPI
    .get()
    .then(bookDetails => {
      console.log(bookDetails);      
      res.render('book-detail', bookDetails.data)
    })  
})

// =====================================================================================================================================
// Adding Book to the Library

router.post('/book/add-library', (req, res, next) => {
  const { title, authors, description, image } = req.body;
  console.log(req.body);
  
})


module.exports = router;
