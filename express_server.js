const express = require("express");
const morgan = require("morgan");
const bcrypt = require("bcrypt");
const cookieSession = require('cookie-session');
const { generateRandomString, getUserByEmail, urlsForUser} = require("./helper"); // helper functions
const app = express();
const PORT = 8080; // default port 8080
// const bodyParser = require("body-parser"); //this is obsolete

app.use(express.urlencoded({ extended: true })); // use this instead of bodyParser
app.use(morgan("dev"));
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['my secret key', 'my another secret key']
}));

// ########################################################################################## DATABASES

// URL Database. THIS WILL KEEP ON ADDING ON AS LONG AS THE SERVER IS LIVE
const urlDatabase = {
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "userRandomID",
  },
};

// USERS Database
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "b@b.com",
    password: "$2b$10$DTIYLI/CbZn6Om.F8RBB/.W1iyQUPA7mE6ubN87frRSOGV6tqCJJK", // 1234
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "c@c.com",
    password: "$2b$10$8SDT16uUgNdipHK/WTcCueEJFX8bwhs/BD6a6Dk0FXsDiShMu24p6", // 1234
  },
};

// ########################################################################################## LOGIN

// Login render page / GET /login
app.get("/login", (req, res) => {
  const templateVars = {
    "user_id": req.session.user_id,
    users: users,
  };

  res.render("login_index", templateVars);
});

// Login Cookie Session / POST /login
app.post("/login", (req, res) => {
  const testEmail = req.body.email;
  const testPW = req.body.password;
  const existUser = getUserByEmail(req.body.email, users);
  console.log("User Information:", existUser);

  // MUST input both
  if (testEmail === "" || testPW === "") {
    return res.status(400).send(`Please fill in the Email & Password </br><html><body><a href=/>Try Again</a></body></html>`);
  } else {
    if (existUser && bcrypt.compareSync(testPW, existUser.password)) {
      req.session["user_id"] = existUser.id;
      return res.redirect("/urls");
    }
  }
  return res.status(403).send("Incorrect Email or Password!</br><html><body><a href=/login>Try Again</a></body></html>"); // must be outside the first IF statement. If not, it'll stop in the middle
});

// ########################################################################################## REGISTER

// Register / GET /register
app.get("/register", (req, res) => {
  const templateVars = {
    "user_id": req.session.user_id,
    users: users,
  };
  res.render("register_index", templateVars);
});

// new user / POST /
app.post("/register", (req, res) => {
  const testEmail = req.body.email;
  const testPW = req.body.password;

  // both email and password needs to be filled in
  if (testEmail === "" || testPW === "") {
    return res.status(400).send("Please fill in the Email and Password</br><html><body><a href=/register>Try Again</a></body></html>");
  }

  // no duplicated email addresses
  const dupUser = getUserByEmail(req.body.email, users);

  if (dupUser) {
    return res.status(400).send(`You have already registered with the same email address!</br><html><body><a href=/>Login Page</a></body></html>`);
  }

  // hashed PW registeration
  const newID = generateRandomString();

  bcrypt
    .genSalt(10)
    .then((salt) => {
      return bcrypt.hash(testPW, salt);
    })
    .then((hash) => {
      users[newID] = {
        id: newID,
        email: testEmail,
        password: hash,
      };
      console.log("all users:", users);
      res.redirect("/urls");
    });
});

// ########################################################################################## URLS

// list of personal urls in the database object
app.get("/urls", (req, res) => {
  if (req.session.user_id === undefined) {
    res.redirect("/login");
  } else {
    const userDatabase = urlsForUser(req.session.user_id, urlDatabase);
    const templateVars = {
      urls: userDatabase,
      "user_id": req.session.user_id,
      users: users,
    };
    res.render("urls_index", templateVars); // for Express, it automatically searches in the view file with .ejs
  }
});

// GET urls/new // Create New URL. Redirect to /login if not logged in
app.get("/urls/new", (req, res) => {
  if (req.session.user_id === undefined) {
    res.redirect("/login");
  } else {
    const templateVars = {
      "user_id": req.session.user_id,
      users: users,
    };
    res.render("urls_new", templateVars);
  }
});

// new url redirect page
app.post("/urls", (req, res) => {
  console.log("New url created for : ", req.body);

  if (req.session.user_id === undefined) {
    res.status(404).send("Please login first!");
  } else {
    const newShortURL = generateRandomString();
    urlDatabase[newShortURL] = {
      longURL: req.body.longURL,
      userID: req.session.user_id,
    }; // the value of the new short URL ID/key
    res.redirect(`/urls/${newShortURL}`);
  }
});

// parameter based on the database ID
app.get("/urls/:shortURL", (req, res) => {
  const userDatabase = urlsForUser(req.session.user_id, urlDatabase);
  const userShortUrl = req.params.shortURL;

  //validate user with registered url
  if (userDatabase[userShortUrl] === undefined) {
    return res.status(404).send(` ACCESS DENIED </br><html><body><a href=/>Home</a></body></html>`);
  } else {
    const templateVars = {
      shortURL: userShortUrl,
      longURL: urlDatabase[userShortUrl].longURL,
      "user_id": req.session.user_id,
    };
    res.render("urls_show", templateVars);
  }
});

// redirect to the original longURL
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.status(404).send("You have requested a non-existent shortURL!");
  } else {
    res.redirect(urlDatabase[req.params.shortURL].longURL);
  }
});

// Edit / POST /urls/:shortURL
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;

  if (req.session.user_id !== urlDatabase[shortURL].userID) {
    res.status(404).send("You are not authorized to Edit!");
  }
  const newLongURL = req.body.updateURL; // body parser in express //this creates a new value
  urlDatabase[shortURL].longURL = newLongURL;
  console.log("Long URL changed to : ", newLongURL);
  res.redirect("/urls");
});

// DELETE / POST /urls/:shortURL/delete
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;

  if (req.session.user_id !== urlDatabase[shortURL].userID) {
    res.status(404).send("You are not authorized to delete!");
  }
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// ########################################################################################## LOGOUT

// Logout Cookie session / POST / logout
app.post("/logout", (req, res) => {
  req.session = null; // this will clear the cookies. req.session["user_id"] keeps the cookie
  res.redirect("/urls");
});

// ########################################################################################## OTHERS

// REDIRECT TO HOME /urls
app.get("/", (req, res) => {
  res.redirect("/urls");
});

// app listening on PORT
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

// // direct html example. Not a good way
// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });


