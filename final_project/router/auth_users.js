const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

// ponytail: hardcoded like the session secret in index.js, move both to env vars outside this lab
const JWT_SECRET = "fingerprint_customer";

// ponytail: in-memory plaintext passwords, lost on restart; use a database and bcrypt outside this lab
let users = [];

const isValid = (username)=>{ //returns boolean
  return !users.some((user) => user.username === username);
}

const authenticatedUser = (username,password)=>{ //returns boolean
  return users.some((user) => user.username === username && user.password === password);
}

//only registered users can login
regd_users.post("/login", (req,res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({message: "Username and password are required"});
  }
  if (!authenticatedUser(username, password)) {
    return res.status(401).json({message: "Invalid username or password"});
  }
  const accessToken = jwt.sign({ username }, JWT_SECRET, { expiresIn: "1h" });
  req.session.authorization = { accessToken, username };
  return res.status(200).json({message: "Customer successfully logged in"});
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review;
  if (!Object.hasOwn(books, isbn)) {
    return res.status(404).json({message: "Book not found"});
  }
  if (typeof review !== "string" || !review) {
    return res.status(400).json({message: "Review is required"});
  }
  const username = req.session.authorization.username;
  const isUpdate = Object.hasOwn(books[isbn].reviews, username);
  books[isbn].reviews[username] = review;
  return res.status(200).json({
    message: `Review for ISBN ${isbn} ${isUpdate ? "modified" : "added"} by ${username}`,
    reviews: books[isbn].reviews
  });
});

// Delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  if (!Object.hasOwn(books, isbn)) {
    return res.status(404).json({message: "Book not found"});
  }
  const username = req.session.authorization.username;
  if (!Object.hasOwn(books[isbn].reviews, username)) {
    return res.status(404).json({message: `No review by ${username} for ISBN ${isbn}`});
  }
  delete books[isbn].reviews[username];
  return res.status(200).json({
    message: `Review for ISBN ${isbn} by ${username} deleted`,
    reviews: books[isbn].reviews
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
module.exports.JWT_SECRET = JWT_SECRET;
