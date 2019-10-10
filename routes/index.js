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
// Login Page - All libraries
router.get('/libraries', ensureAuthenticated, (req, res, next) => {
  User.findById(req.user._id).populate('library')
    .then(user => {res.render(`libraries`,{user})})
    .catch(err => console.log(err))})

// =====================================================================================================================================
// Library Page
router.get('/library/:libraryID', ensureAuthenticated, (req, res, next) => {
  const { libraryID } = req.params;

  User.findById(req.user._id).populate('library')
  .then(user => {
    Library.findById(libraryID)
      .populate('users')
      .populate({path: 'books', populate : ({path: `waitList`}, {path: `actualUserID`})})
    .then(library => {      
      let roleAdmin = (library.admin.toString() === req.user._id.toString())
      res.render('library', { user, libraryID, library, roleAdmin });
    })
    .catch(err => console.log(err))
  })
  .catch(err => console.log(err))
});

// =====================================================================================================================================
// Adding new Library
router.get('/new-library', ensureAuthenticated, (req, res, next) => {
  User.findById(req.user._id).populate('library')
  .then(user => {res.render(`new-library`,{user})})
  .catch(err => console.log(err))});

router.post('/new-library', ensureAuthenticated, (req, res, next) => {
  const { title, subtitle, description } = req.body;
  
  if (title === "") {
    res.render("/new-library", { message: "Indicate title" });
    return;
  }

  const newLibrary = new Library ({
    title,
    subtitle,
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
// Delete Library
router.get('/library/:libraryID/delete-library', ensureAuthenticated, (req, res, next) => {
  const { libraryID } = req.params;
  Library.findById(libraryID)
  .then(library => {
    if (library.admin.toString() === req.user._id.toString()) {
      Library.findByIdAndDelete(libraryID)
        .then(() => {
          User.findById(req.user._id)
            .then(user => {
              for(let i = 0; i < user.library.length; i += 1) {
                if (user.library[i] == libraryID){
                  user.library.splice(i , 1)                  
                }
              console.log(i,":", user);              
              }
              console.log("teste",user);
              const { library } = user            
              User.findByIdAndUpdate(user._id, { library })
                .then(() => {
                  Book.findOneAndDelete({libraryID: libraryID})
                    .then(res.redirect('/libraries'))
                    .catch(err => console.log(err))
                })
                .catch(err => console.log(err))      
            })
            .catch(err => console.log(err))    
        })
        .catch(err => console.log(err))
    } else { res.render('/library', {message: "Operation not allowed"}) }
  })
})
// =====================================================================================================================================
// Update Library
router.get('/library/:libraryID/edit-library'), ensureAuthenticated, (req, res, next) => {
  const { libraryID } = req.params;
  Library.findById(libraryID)
  .then(library => {
    if (library.admin.toString() === req.user._id.toString()) {
      Library.findById(libraryID)
        .populate('users')
        .populate({path: 'books', populate : ({path: `waitList`}, {path: `actualUserID`})})
        .then(library => {
          res.render('edit-library', { library });
        })
        .catch(err => console.log(err))
    } else { res.render('/library', {message: "Operation not allowed"}) }
  })
  .catch(err => console.log(err))
}

router.post('/library/:libraryID/edit-library', ensureAuthenticated, (req, res, next) => {
  const { libraryID } = req.params;
  const { title, subtitle, description } = req.body

  if (library.admin.toString() === req.user._id.toString()) {
    Library.findByIdAndUpdate( libraryID, { title, subtitle, description } )
      .then(res.redirect(`/library/${libraryID}`))
      .catch(err => console.log(err))
  } else { res.render('/library', {message: "Operation not allowed"}) }
})
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
  User.findById(req.user._id).populate('library')
    .then(user => {
      res.render('search-book', { user, libraryID })
    })
    .catch(err => console.log(err))
})

router.get('/library/:libraryID/search-book', (req, res, next) => {
  const { libraryID } = req.params;
  console.log(libraryID);
  
  const { title, author } = req.query  
  const bookTitleValue = title.trim().replace(' ', '+');
  const bookAuthorValue = author.trim().replace(' ', '+');

  if (bookTitleValue === '' && bookAuthorValue === '') {
    res.render('search-book', { message: 'Adicione um título ou um autor'})
  } else if (bookTitleValue !== '' && bookAuthorValue === '') {
    const bookValue = `intitle:${bookTitleValue}`;
    const booksAPI = axios.create( {baseURL: `https://www.googleapis.com/books/v1/volumes?q=${bookValue}&maxResults=40`} );
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
        User.findById(req.user._id).populate('library')
        .then(user => {
          res.render('search-book', { libraryID, user, items }); 
        })
        .catch(err => console.log(err))  
      })
      .catch(err => { console.log(err)});
  } else if (bookTitleValue === '' && bookAuthorValue !== '') {
    const bookValue = `inauthor:${bookAuthorValue}`;
    const booksAPI = axios.create( {baseURL: `https://www.googleapis.com/books/v1/volumes?q=${bookValue}&maxResults=40`} );
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
        User.findById(req.user._id).populate('library')
        .then(user => {
          res.render('search-book', { libraryID, user, items }); 
        })
        .catch(err => console.log(err))
      })
      .catch(err => { console.log(err) });
  } else {
    const bookValue = `intitle:${bookTitleValue}+inauthor:${bookAuthorValue}`;
    const booksAPI = axios.create( {baseURL: `https://www.googleapis.com/books/v1/volumes?q=${bookValue}&maxResults=40`} );
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
        User.findById(req.user._id).populate('library')
        .then(user => {
          res.render('search-book', { libraryID, user, items }); 
        })
        .catch(err => console.log(err))
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
      User.findById(req.user._id).populate('library')
      .then(user => {
        console.log(bookDetails);
        
        res.render('book-detail', { user, bookDetails })
      })
      .catch(err => console.log(err))       
    })
    .catch(err => console.log(err)) 
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
// Book detail of each book of a library
router.get('/library/:libraryID/book/:bookID/book-detail', (req, res, next) => {
  const { libraryID, bookID } = req.params;
  User.findById(req.user._id)
    .then(user => {
      Book.findById(bookID)
        .then(book => res.render('book-det-library', {user, book}))
        .catch(err=>console.log(err))
    })
    .catch(err => console.log(err))
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
  Library.findById(req.user._id)
    .then(library => {
      if (library.admin.toString() === req.user._id.toString()) {
        for (let i = 0; i < library.books.length; i += 1) {
          if(library.books[i] == bookID) {
            library.books.splice(i, 1)
          }
        }
        const { books } = library;
        Library.findByIdAndUpdate(libraryID, { books })
          .then(() => {
            Book.findByIdAndDelete(bookID)
            .then(res.redirect(`/library/${libraryID}`))
            .catch(err=>console.log(err))
          })
          .catch(err=>console.log(err))
      }
    })
    .catch(err=>console.log(err))
});
// =====================================================================================================================================
// Changing the actual user
router.get(`/library/:libraryID/book/:bookID/changeuser`, (req, res, next) => {
  const { libraryID, bookID } = req.params;
  Book.findById(bookID)
    .then(book => {
      book.usersLog.push(book.actualUserID);
      book.actualuserID = book.waitList[0];
      book.waitList.shift();
      book.dateStart = new Date();
      const { userLog, actualUserID, waitList, dateStart } = book;
      Book.findOneAndUpdate(book._id, { userLog, actualUserID, waitList, dateStart })
        .then(res.redirect(`/library/${libraryID}`))
        .catch(err=>console.log(err))
    })
    .catch(err=>console.log(err))
})

module.exports = router;
