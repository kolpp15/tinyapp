const express = require("express");
const morgan = require("morgan");
// const bodyParser = require("body-parser"); //this is obsolete
const app = express();
const PORT = 8080; // default port 8080

app.use(express.urlencoded({extended: true})); // use this instead of bodyParser
app.use(morgan("dev"));
app.set("view engine", "ejs");

const generateRandomString = function(length = 6) {
  return Math.random().toString(20).substr(2, length);
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase }; // refer to the above object. This can also be a direct object
  res.render("urls_index", templateVars); // for Express, it automatically searches in the view file with .ejs
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  console.log(req.body);
  res.send("OK");
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
