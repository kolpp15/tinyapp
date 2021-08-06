
// Create random strings
const generateRandomString = function(length = 6) {
  return Math.random().toString(20).substr(2, length);
};

// Function: returns the URLS where the userID is equal to the id of current logged-in user
// Loop through urlDatabase (forin), match id & urlDatabaseID, if match return object
const urlsForUser = (id, urlDatabase) => {
  const userObj = {};
  for (const data in urlDatabase) {
    if (id === urlDatabase[data].userID) {
      userObj[data] = urlDatabase[data];
    }
  }
  return userObj;
};

const getUserByEmail = (email, database) => {
  for (const user in database) {
    if (email === database[user].email) {
      return database[user];
    }
  }
  return undefined;
};

module.exports = { generateRandomString, urlsForUser, getUserByEmail };