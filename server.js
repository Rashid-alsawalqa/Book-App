'use strict';
const express = require('express');

const app = express();

const cors = require('cors');

require('dotenv').config();

const pg = require('pg'); 

const client = new pg.Client(process.env.DATABASE_URL);

const superagent = require('superagent');

const PORT = process.env.PORT;


app.set('view engine', 'ejs')
app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));

function handleError(error, response){
    response.render('pages/error', {error: error});
}


app.get('/', getAllBooks);
app.get('/new', addBooks);
app.post('/search', searcheData);
app.post('/new', processAdd);
app.post('/edit', edaitSelected);
app.get('/books/:book_id', getSpecificBook);


function edaitSelected(req,res){
    res.render('pages/books/show', {book:req.body})
}

function getSpecificBook(req,res){
    let SQL = `SELECT * FROM book WHERE id=$1`;
    let id = req.params.book_id;
    let values =[id];
    client.query(SQL,values)
    .then(data=>{
        res.render('pages/books/detail',{book: data.rows[0]});
    }).catch(err=>handleError(err));
}

function getAllBooks(req,res){
    let SQL = `SELECT * FROM book;`;
    client.query(SQL)
    .then(data=>{
        res.render('pages/index',{booksList: data.rows});
    }).catch(err=>hanleError(err));
}
function addBooks(req,res){
    res.render('pages/searches/new')
}


function processAdd(req,res){
    let { image_url, title, author, description, isbn, bookshelf } = req.body
    let SQL = `INSERT INTO book (image_url, title, author, description, isbn, bookshelf) VALUES ($1, $2, $3, $4, $5, $6)`
    let values = [image_url, title, author, description, isbn, bookshelf]
    client.query(SQL, values)
    .then( () => {
        res.redirect('/');
    }).catch(err => handleError(err));
}
function searcheData(req, res){
    const url = `https://www.googleapis.com/books/v1/volumes?q=${req.body.select}+${req.body.input}`;
    superagent.get(url)
        .then(data => {
            let jsaonData = data.body.items;
            let book = jsaonData.map(data => new Book(data));
            res.render('pages/searches/show', {books:book});
        })
}
function Book(data) {
    this.title = data.volumeInfo.title? data.volumeInfo.title: "No Title Available";
    this.author = data.volumeInfo.authors? data.volumeInfo.authors: "No Authors";
    this.image_url = (data.volumeInfo.imageLinks && data.volumeInfo.imageLinks.thumbnail) ? data.volumeInfo.imageLinks.thumbnail:"https://i.imgur.com/J5LVHEL.jpg";
    this.description = data.volumeInfo.description? data.volumeInfo.description:"No description available";
}

let message = "ERROR"
app.get('*', (req, res) => {
    res.status(404).render('./pages/error', { 'message': message })
});

client.connect()
.then(()=>{
    app.listen(PORT, () => console.log(PORT, `It's Work`));
}).catch(err => handleError(err));


