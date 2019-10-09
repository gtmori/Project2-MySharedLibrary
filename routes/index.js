// =====================================================================================================================================
// Packages and Models require 
const express = require('express');
const router  = express.Router();
const Library = require(`../models/Library`);
const User = require(`../models/User`);
const Book = require(`../models/Book`);
const axios = require('axios');

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
  res.render(`libraries`, req.user )
})

// =====================================================================================================================================
// Library Page
router.get('/library/:libraryID', ensureAuthenticated, (req, res, next) => {
  const { libraryID } = req.params;
  Library.findById(libraryID).populate('users').populate('books')
    .then(library => {
      let role = (library.admin.toString() === req.user._id.toString())      
      res.render('library', { libraryID, library, role });
    })
    .catch(err => console.log(err))
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
    admin: req.user._id,
    users: req.user._id
  })

  newLibrary.save()
    .then(library => {
      User.findByIdAndUpdate(req.user._id, {$push: {library: library}})
        .then(
          res.redirect(`/library/${library._id}`)  
        )
        .catch(err => console.log(err))
    })
    .catch(err => console.log(err))
});

// =====================================================================================================================================
// Adding user to a library
router.get('/library/:libraryID/adduser', ensureAuthenticated, (req, res, next) => {
  const { libraryID } = req.params;
  
  Promise.all([
    Library.findByIdAndUpdate(libraryID,{$push: {users: req.user}}), 
    User.findByIdAndUpdate(req.user._id, {$push: {library: libraryID}})
  ])
    .then(res.redirect(`/library/${libraryID}`))
    .catch(err => console.log(err))
  })
// =====================================================================================================================================
// Search Book from Google API - List
router.get('/library/:libraryID/search', (req, res, next) => {
  const { libraryID } = req.params;
  res.render('search-book', { libraryID })
})

router.get('/library/:libraryID/search-book', (req, res, next) => {
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
          if (book.volumeInfo.authors !== null && book.volumeInfo.authors !== undefined)  {
            book.volumeInfo.authors = book.volumeInfo.authors.join(` | `);
          } else {
              book.volumeInfo.authors = '';
            }
        })
        const { items } = bookList.data;      
        res.render('book-list', { items });     
      })
      .catch(err => { console.log(err)});
  } else if (bookTitleValue === '' && bookAuthorValue !== '') {
    const bookValue = `inauthor:${bookAuthorValue}`;
    const booksAPI = axios.create( {baseURL: `https://www.googleapis.com/books/v1/volumes?q=${bookValue}`} );
    booksAPI
      .get()
      .then(bookList => {
        bookList.data.items.forEach(book => {
          if (book.volumeInfo.authors !== null && book.volumeInfo.authors !== undefined)  {
            book.volumeInfo.authors = book.volumeInfo.authors.join(` | `);
          } else {
              book.volumeInfo.authors = '';
            }
        })
        const { items } = bookList.data       
        res.render('book-list', { items })
      })
      .catch(err => { console.log(err) });
  } else {
    const bookValue = `intitle:${bookTitleValue}+inauthor:${bookAuthorValue}`;
    const booksAPI = axios.create( {baseURL: `https://www.googleapis.com/books/v1/volumes?q=${bookValue}`} );
    booksAPI
      .get()
      .then(bookList => {
        bookList.data.items.forEach(book => {
          if (book.volumeInfo.authors !== null && book.volumeInfo.authors !== undefined)  {
            book.volumeInfo.authors = book.volumeInfo.authors.join(` | `);
          } else {
              book.volumeInfo.authors = '';
            }
        })
        const { items } = bookList.data        
        res.render('book-list', { items })
      })
      .catch(err => { console.log(err)});
  }
})

// =====================================================================================================================================
// Search Book from Google API - Details

router.get('/library/:libraryID/book-detail/:bookID', (req, res, next) => {
  const { bookID } = req.params;
  const bookAPI = axios.create( {baseURL: `https://www.googleapis.com/books/v1/volumes/${bookID}`} );
  bookAPI
    .get()
    .then(bookDetails => {
      if(bookDetails.data.volumeInfo.authors !== null && bookDetails.data.volumeInfo.authors !== undefined) {
        bookDetails.data.volumeInfo.authors = bookDetails.data.volumeInfo.authors.join(` | `);
      } else {bookDetails.data.volumeInfo.authors = ''}
      res.render('book-detail', bookDetails.data)
    })  
})

// =====================================================================================================================================
// Adding Book to the Library from the list
router.post('/library/:libraryID/add-book', (req, res, next) => {
  const { libraryID } = req.params
  const { title, authors, description, image } = req.body;

  const newBook = new Book ({
    title,
    authors,
    description,
    image,
    libraryID,
    actualUserID: req.user._id,
    usersLog: req.user._id,
  })
  
  newBook.save()
    .then(book => {
      Library.findByIdAndUpdate(libraryID, {$push: {books: book}})
        .then(res.redirect(`/library/${libraryID}`))
        .catch(err=>console.log(err))    
    })
    .catch(err=>console.log(err))
})

// =====================================================================================================================================
// Adding Book to the Library from the book details
router.post('/library/:libraryID/book-detail/add-book', (req, res, next) => {
  const { libraryID } = req.params
  const { title, authors, description, image } = req.body;

  const newBook = new Book ({
    title,
    authors,
    description,
    image,
    libraryID,
    actualUserID: req.user._id,
    usersLog: req.user._id,
  })
  
  newBook.save()
    .then(book => {
      Library.findByIdAndUpdate(libraryID, {$push: {books: book}})
        .then(res.redirect(`/library/${libraryID}`))
        .catch(err=>console.log(err))    
    })
    .catch(err=>console.log(err))
})
// =====================================================================================================================================
// Getting in the wait list of the book in a library
router.get('/library/:libraryID/book/:bookID/add-user-waitinglist', (req, res, next) => {
  const { libraryID, bookID } = req.params;
  Book.findByIdAndUpdate(bookID, {$push: {waitList: req.user}})
    .then(res.redirect(`/library/${libraryID}`))
    .catch(err=>console.log(err))
})

// =====================================================================================================================================
// Remove book from a library
router.get(`/library/:libraryID/book/:bookID/remove`, (req,res,next) => {
  const { libraryID, bookID } = req.params;
  Book.findByIdAndDelete(bookID)
    .then(res.redirect(`/library/${libraryID}`))
    .catch(err=>console.log(err))
})


module.exports = router;
