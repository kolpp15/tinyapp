# TinyApp Project

TinyApp is a full stack web application built with Node and Express that allows users to shorten long URLs (à la bit.ly).

## Final Product

!["Home - Login Page"](#)

!["User - List of URLs"](#)

!["User - Edit URL"](#)

## Dependencies

- Node.js
- Express
- EJS
- bcrypt
- body-parser
- cookie-session
- morgan

## Getting Started

- Install all dependencies (using the `npm install` command).
- Run the development web server using the `node express_server.js` command.
- Open up a browser and launch: [localhost:8080/urls](localhost:8080/urls)
- Click Register if you do not have an account
  > Passwords are #️⃣hashed 
- Login with your credentials 
- Click "Create New URL" on the top left to shorten a URL
- Click "My URLS" to see the full list of your shortened URLs
- You can share, edit or delete URLs
- Log out to clear cookies