'use strict'

require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const superagent = require('superagent');

const pg = require('pg');

const client = new pg.Client(process.env.DATABASE_URL);

const PORT = process.env.PORT || 8500;
app.use(express.static('./public'));
app.use(express.urlencoded({extended: true }));
app.set('view engine', 'ejs');
app.post('/edit', edaitSelected);
app.post('/searches', getBookInfo);
app.post('/new', processAdd);
app.get('/', getForm);
app.get('/new', addBooks);
app.get('/books/:book_id', getSpecificBook);


function handleError(error, response){
  response.render('pages/error', {error: error});
}


function getForm(request, response) {
  response.render('pages/index');
};


function edaitSelected(req,res){
  res.render('pages/books/show', {book:req.body})
};


function getSpecificBook(req,res){
  let SQL = `SELECT * FROM book WHERE id=$1`;
  let id = req.params.book_id;
  let values =[id];
  client.query(SQL,values)
  .then(data=>{
      res.render('pages/books/detail',{book: data.rows[0]});
  }).catch(err=>handleError(err));
};


function getBookInfo(req,res){
  let SQL = `SELECT * FROM book;`;
  client.query(SQL)
  .then(data=>{
      res.render('pages/index',{booksList: data.rows});
  }).catch(err=>hanleError(err));
};

function addBooks(req,res){
  res.render('pages/searches/new')
};

function processAdd(req,res){
  let { image_url, title, author, description, isbn, bookshelf } = req.body
  let SQL = `INSERT INTO book (image_url, title, author, description, isbn, bookshelf) VALUES ($1, $2, $3, $4, $5, $6)`
  let values = [image_url, title, author, description, isbn, bookshelf]

  client.query(SQL, values)
  .then( () => {
      res.redirect('/');
  }).catch(err => handleError(err));
}


function getBookInfo(request, response) {
  let url = 'https://www.googleapis.com/books/v1/volumes?q='
  let typeOfSearch = request.body.search[1];
  let searching = request.body.search[0];
  console.log(request);

  if (typeOfSearch === 'author') {
    url += `+inauthor:${searching}`;
  };
  if (typeOfSearch === 'title') {
    url += `+intitle:${searching}`;
  };

  superagent.get(url)
        .then(data => {
            let book = data.body.items.map(data => new Book(data));
            response.render('pages/searches/show', {books:book});
        })
};

function Book(data) {
  this.title = data.volumeInfo.title? data.volumeInfo.title: "No Title Available";
  this.imgUrl = (data.volumeInfo.imageLinks && data.volumeInfo.imageLinks.thumbnail) ? data.volumeInfo.imageLinks.thumbnail:"https://i.imgur.com/J5LVHEL.jpg";
  this.authors = data.volumeInfo.authors? data.volumeInfo.authors: "No Authors";
  this.description = data.volumeInfo.description? data.volumeInfo.description:"No description available";
};


let message = "error"
app.get('*', (req, res) => {
    res.status(404).render('./pages/error', { 'message': message })
});

client.connect()
.then(()=>{
  app.listen(PORT, () => console.log(`listening on ${PORT}`));
}).catch(err => handleError(err));


