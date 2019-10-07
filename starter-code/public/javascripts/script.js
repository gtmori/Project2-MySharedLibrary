
document.getElementById("searchBook").onclick = () => {
  const bookTitleValue = document.getElementById("inputSearchTitleBook").value.trim().replace(' ', '+');
  const bookAuthorValue = document.getElementById("inputSearchAuthorBook").value.trim().replace(' ', '+');
  let booksAPI;
  if (bookTitleValue === '' && bookAuthorValue === '') {
    document.getElementById("messageError").innerHTML = 'Adicione um título ou um autor'
  } else if (bookTitleValue !== '' && bookAuthorValue === '') {
    const bookValue = `intitle:${bookTitleValue}`;
    booksAPI = axios.create( {baseURL: `https://www.googleapis.com/books/v1/volumes?q=${bookValue}`} );
  } else if (bookTitleValue === '' && bookAuthorValue !== '') {
    const bookValue = `inauthor:${bookAuthorValue}`;
    booksAPI = axios.create( {baseURL: `https://www.googleapis.com/books/v1/volumes?q=${bookValue}`} );
  } else {
    const bookValue = `intitle:${bookTitleValue}+inauthor:${bookAuthorValue}`;
    booksAPI = axios.create( {baseURL: `https://www.googleapis.com/books/v1/volumes?q=${bookValue}`} );
  }

  booksAPI
    .get()
    .then(books => {   
      if (books.data.items.length === 0) {
        document.getElementById(`messageOtherSearch`)
      } else {
          const searchResult = document.getElementById(`divListBook`)
          searchResult.innerHTML = ``;
          books.data.items.forEach((book) => {
            
            // DOM MANIPULATION OF SEARCH BOOK PAGE
            const bookTemplate = document.createElement('div');
            bookTemplate.classList.add('bookTemplate');
            const bookImage = document.createElement('img');
            bookImage.setAttribute('src', book.volumeInfo.imageLinks.thumbnail);
            const bookTitle = document.createElement('h2');
            bookTitle.innerHTML = book.volumeInfo.title;
            const bookAuthor = document.createElement('h3');
            bookAuthor.innerHTML = book.volumeInfo.authors.join(' | ');
            const detailsButton = document.createElement('a')
            detailsButton.setAttribute('href', "/details");
            detailsButton.innerHTML = `Mais detalhes`;

            // DOM MANIPULATION OF BOOK DETAILS PAGE
            const bookDetailsManipulation = () => {
              const bookDetailDiv = document.getElementById('bookDetailDiv');
              bookDetailDiv.innerHTML = ` `;
              const bookDetailTitle = document.getElementById('bookDetailImage');
              bookDetailTitle.innerHTML = `Title: ` + book.volumeInfo.title;
              const bookDetailAuthor = document.getElementById('bookDetailAuthor');
              bookDetailAuthor.innerHTML = `Authors: ` + book.volumeInfo.authors.join(` | `);
              const bookDetailPublisher = document.getElementById('bookDetailPublisher');
              bookDetailPublisher.innerHTML = `Publisher: ` + book.volumeInfo.publisher;
              const bookDetailPublishedDate = document.getElementById('bookDetailPublishedDate');
              bookDetailPublishedDate.innerHTML = `Published Date: ` + book.volumeInfo.publishedDate;
              const bookDetailDescription = document.getElementById('bookDetailDescription');
              bookDetailDescription.innerHTML = `Published Date: ` + book.volumeInfo.description;
            }
            detailsButton.onclick = () => {
              const bookDetailsPage = bookDetailsManipulation();


              // console.log(book.volumeInfo);
              // const bookAPI = axios.create( {baseURL: `http://localhost:3000/api`} );
              // bookAPI.post()
              
              
              // axios({
              //   method:`post`,
              //   url:`/details`,
              //   data: book.volumeInfo,
              // })

              // axios.post( `http://localhost:3000/details`, book.volumeInfo)
              //   .then(response => console.log("book", response))
              //   .catch(err => {console.log(err)});
            }

            const addBookButton = document.createElement('button')
            addBookButton.setAttribute('type', "submit");
            addBookButton.innerHTML = `Adicionar a biblioteca`;
            addBookButton.onclick = () => {
              axios.get(`localhost:3000/add-library`, { book } )
            }
            bookTemplate.appendChild(bookImage);
            bookTemplate.appendChild(bookTitle);
            bookTemplate.appendChild(bookAuthor);
            bookTemplate.appendChild(detailsButton);
            bookTemplate.appendChild(addBookButton);
            searchResult.appendChild(bookTemplate);
        })
      }
    })
    .catch(err => { console.log(err) });
}