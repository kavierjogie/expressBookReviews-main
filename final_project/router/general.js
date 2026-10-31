const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const BASE_URL = "http://localhost:5000";

// Find books whose given field exactly matches value, keeping each book's ISBN
const findBooksBy = (field, value) =>
  Object.keys(books)
    .filter((isbn) => books[isbn][field] === value)
    .map((isbn) => ({ isbn, ...books[isbn] }));

public_users.post("/register", (req,res) => {
  const { username, password } = req.body || {};
  if (typeof username !== "string" || typeof password !== "string" || !username || !password) {
    return res.status(400).json({message: "Username and password are required"});
  }
  if (!isValid(username)) {
    return res.status(409).json({message: "Username already exists"});
  }
  users.push({ username, password });
  return res.status(200).json({message: "User successfully registered. Now you can login"});
});

// Get the book list available in the shop
public_users.get('/',function (req, res) {
  return res.type('json').send(JSON.stringify(books, null, 4));
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn',function (req, res) {
  const isbn = req.params.isbn;
  if (!Object.hasOwn(books, isbn)) {
    return res.status(404).json({message: "Book not found"});
  }
  return res.status(200).json(books[isbn]);
 });

// Get book details based on author
public_users.get('/author/:author',function (req, res) {
  const matches = findBooksBy("author", req.params.author);
  if (matches.length === 0) {
    return res.status(404).json({message: "No books found for this author"});
  }
  return res.status(200).json(matches);
});

// Get all books based on title
public_users.get('/title/:title',function (req, res) {
  const matches = findBooksBy("title", req.params.title);
  if (matches.length === 0) {
    return res.status(404).json({message: "No books found with this title"});
  }
  return res.status(200).json(matches);
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
  const isbn = req.params.isbn;
  if (!Object.hasOwn(books, isbn)) {
    return res.status(404).json({message: "Book not found"});
  }
  return res.status(200).json(books[isbn].reviews);
});

// Task 10: get the book list using async-await with Axios
const getAllBooks = async () => {
  const response = await axios.get(`${BASE_URL}/`);
  return response.data;
};

// Task 11: get book details based on ISBN using async-await with Axios
const getBookByISBN = async (isbn) => {
  const response = await axios.get(`${BASE_URL}/isbn/${encodeURIComponent(isbn)}`);
  return response.data;
};

// Task 12: get book details based on author using async-await with Axios
const getBooksByAuthor = async (author) => {
  const response = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`);
  return response.data;
};

// Task 13: get book details based on title using async-await with Axios
const getBooksByTitle = async (title) => {
  const response = await axios.get(`${BASE_URL}/title/${encodeURIComponent(title)}`);
  return response.data;
};

// Send the Axios result, passing on the status and body of a failed request
const sendResult = async (res, fetchResult) => {
  try {
    return res.status(200).json(await fetchResult());
  } catch (err) {
    return res.status(err.response?.status || 500).json(err.response?.data || {message: err.message});
  }
};

public_users.get('/async/books', (req, res) => sendResult(res, () => getAllBooks()));
public_users.get('/async/isbn/:isbn', (req, res) => sendResult(res, () => getBookByISBN(req.params.isbn)));
public_users.get('/async/author/:author', (req, res) => sendResult(res, () => getBooksByAuthor(req.params.author)));
public_users.get('/async/title/:title', (req, res) => sendResult(res, () => getBooksByTitle(req.params.title)));

module.exports.general = public_users;
