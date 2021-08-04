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

// URL Database. THIS WILL KEEP ON ADDING ON AS LONG AS THE SERVER IS LIVE
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

// Create random strings
const generateRandomString = function(length = 6) {
  return Math.random().toString(20).substr(2, length);
};

  
// // check if email/pw is registered
// for (const user in users)
//   if (req.body.email !== users[user]) {
//     res.status(400);
//     res.send('You have not registered with this credentials');
//   }

// Login Endpoint / GET /login
app.get("/login", (req, res) => {
  const templateVars = {
    "user_id": req.cookies.user_id,
    users: users
  };
  
  res.render("login_index", templateVars);
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

// Register / GET /register
app.get("/register", (req, res) => {
  const templateVars = {
    "user_id": req.cookies.user_id,
    users: users
  };
  
  res.render("register_index", templateVars);
});


// list of urls in the database object
app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    "user_id": req.cookies.user_id,
    users: users
  }; // refer to the above object. This can also be a direct object
  
  res.render("urls_index", templateVars); // for Express, it automatically searches in the view file with .ejs
});

// url new page ********** THIS GET HAS TO BE DEFINED BEFORE /urls/:id. ROUTES SHOULD BE ORDERED FROM MOST SPECIFIC TO LEAST.
app.get("/urls/new", (req, res) => {
  const templateVars = {
    "user_id": req.cookies.user_id,
    users: users
  };

  res.render("urls_new", templateVars);
});

// Cookie / POST /login
app.post("/login", (req, res) => {
  const templateVars = {
    "user_id": req.body.user_id,
    users: users // create a new value
  };

  res.cookie("user_id", templateVars); // (name,value)
  res.redirect("/urls"); // redirect to urls page
});

// Cookie / POST / logout
app.post("/logout", (req, res) => {
  const templateVars = {
    "user_id": req.body.user_id,
    users: users
  };

  res.clearCookie("user_id", templateVars);
  res.redirect("/urls");
});

// new url redirect page *********************
app.post("/urls", (req, res) => {
  console.log(req.body);

  const newShortURL = generateRandomString();
  urlDatabase[newShortURL] = req.body.longURL; // the value of the new short URL ID/key

  res.redirect(`/urls/${newShortURL}`);
});

// parameter based on the database ID
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    "user_id": req.cookies.user_id,
    users: users
  };

  res.render("urls_show", templateVars);
});

// redirect to the original longURL **************
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.status(404);
    res.send("You have requested a non-existent shortURL!");
  } else {
    res.redirect(urlDatabase[req.params.shortURL]);
  }
});

// Edit / POST /urls/:shortURL
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const newLongURL = req.body.updateURL; // body parser in express //this creates a new value
  urlDatabase[shortURL] = newLongURL;
  res.redirect("/urls");
});

// DELETE / POST /urls/:shortURL/delete
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// ---------------------------------------------------------------------------------------

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// direct html example. Not a good way
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// app listening on PORT
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});