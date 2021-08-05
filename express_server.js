const express = require("express");
const morgan = require("morgan");
const cookieParser = require('cookie-parser');
// const bodyParser = require("body-parser"); //this is obsolete
const app = express();
const PORT = 8080; // default port 8080

app.use(express.urlencoded({extended: true})); // use this instead of bodyParser
app.use(morgan("dev"));
app.set("view engine", "ejs");
app.use(cookieParser());

// ------------------------------------------------------------------------ DATABASE

// URL Database. THIS WILL KEEP ON ADDING ON AS LONG AS THE SERVER IS LIVE
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "userRandomID"
  }
};

// USERS Database
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "b@b.com",
    password: "1234"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "c@c.com",
    password: "1234"
  }
};

// Create random strings
const generateRandomString = function(length = 6) {
  return Math.random().toString(20).substr(2, length);
};

// Function: returns the URLS where the userID is equal to the id of current logged-in user
// Loop through urlDatabase (forin), match id & urlDatabaseID, if match return object
const urlsForUser = (id) => {
  const userObj = {};
  for (const data in urlDatabase) {
    if (id === urlDatabase[data].userID) {
      userObj[data] = urlDatabase[data];
    }
  }
  return userObj;
};

// ------------------------------------------------------------------------ LOGIN

// Login render page / GET /login
app.get("/login", (req, res) => {
  const templateVars = {
    "user_id": req.cookies.user_id,
    users: users
  };
  
  res.render("login_index", templateVars);
});

// Login Cookie / POST /login
app.post("/login", (req, res) => {
  // MUST input both
  if (req.body.email === '' || req.body.password === '') {
    res.status(400);
    res.send('Please fill in the Email and Password');
  }
  for (const user in users) {
    if (req.body.email === users[user].email && req.body.password === users[user].password) {
      res.cookie("user_id", users[user].id);
      return res.redirect("/urls");
    }
  }
  res.status(403); // CAN'T BE ELSE STATEMENT
  res.send('Wrong email/password! Try again');
});

// ------------------------------------------------------------------------ REGISTER

// Register / GET /register
app.get("/register", (req, res) => {
  const templateVars = {
    "user_id": req.cookies.user_id,
    users: users
  };
  
  res.render("register_index", templateVars);
});

// new user / POST /
app.post("/register", (req, res) => {

  // both email and password needs to be filled in
  if (req.body.email === '' || req.body.password === '') {
    res.status(400);
    res.send('Please fill in the Email and Password');
  }
  // no duplicated email addresses.
  for (const user in users) {
    if (req.body.email === users[user].email) {
      res.status(400);
      res.send("You have already registered with the same email address!");
    }
  }

  const newID = generateRandomString();
  const newUser = {
    id: newID,  // this should be the same as the users key
    email: req.body.email,
    password: req.body.password
  };

  users[newID] = newUser;
  console.log('all users:', users);
  
  res.cookie("user_id", newID);
  res.redirect("/urls");
});

// ------------------------------------------------------------------------ URLS

// list of urls in the database object
app.get("/urls", (req, res) => {
  if (req.cookies.user_id === undefined) {
    res.redirect("/login");
  } else {
    const userDatabase = urlsForUser(req.cookies.user_id);
    const templateVars = {
      urls: userDatabase,
      "user_id": req.cookies.user_id,
      users: users
    };
    res.render("urls_index", templateVars); // for Express, it automatically searches in the view file with .ejs
  }
});

// GET urls/new // Create New URL. Redirect to /login if not logged in
app.get("/urls/new", (req, res) => {
  if (req.cookies.user_id === undefined) {
    res.redirect("/login");
  } else {
    const templateVars = {
      "user_id": req.cookies.user_id,
      users: users
    };
    res.render("urls_new", templateVars);
  }
});

// new url redirect page *********************
app.post("/urls", (req, res) => {
  console.log(req.body);

  if (req.cookies.user_id === undefined) {
    res.status(404);
    res.send("Please login first!");
  } else {
    const newShortURL = generateRandomString();
    urlDatabase[newShortURL] = {
      "longURL": req.body.longURL,
      "userID": req.cookies.user_id
    }; // the value of the new short URL ID/key
  
    res.redirect(`/urls/${newShortURL}`);
  }
});

// parameter based on the database ID
app.get("/urls/:shortURL", (req, res) => {
  const userDatabase = urlsForUser(req.cookies.user_id);
  const userShortUrl = req.params.shortURL;
  
  //validate user with registered url
  if (userDatabase[userShortUrl] === undefined) {
    res.status(404);
    res.send(`<html><body><p><b> Please <a href='/login'>log in</a> with a valid account.<b></body></html>`);
  } else {
    const templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      "user_id": req.cookies.user_id,
    };
    res.render("urls_show", templateVars);
  }
});

// redirect to the original longURL **************
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.status(404);
    res.send("You have requested a non-existent shortURL!");
  } else {
    res.redirect(urlDatabase[req.params.shortURL].longURL);
  }
});

// Edit / POST /urls/:shortURL
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;

  if (req.cookies.user_id !== urlDatabase[shortURL].userID) {
    res.status(404);
    res.send('You are not authorized to Edit!');
  }

  const newLongURL = req.body.updateURL; // body parser in express //this creates a new value
  urlDatabase[shortURL].longURL = newLongURL;
  res.redirect("/urls");
});

// DELETE / POST /urls/:shortURL/delete
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;

  if (req.cookies.user_id !== urlDatabase[shortURL].userID) {
    res.status(404);
    res.send('You are not authorized to delete!');
  }
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// ------------------------------------------------------------------------ LOGOUT

// Logout Cookie / POST / logout
app.post("/logout", (req, res) => {
  const templateVars = {
    "user_id": req.body.user_id,
    users: users
  };

  res.clearCookie("user_id", templateVars);
  res.redirect("/urls");
});

// ------------------------------------------------------------------------ OTHERS

app.get("/", (req, res) => {
  res.redirect("/urls");
});

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

// // direct html example. Not a good way
// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

// app listening on PORT
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});