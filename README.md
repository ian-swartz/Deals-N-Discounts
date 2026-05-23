# Deals N' Discounts
This project was built to simulate a real-world e-commerce platform and demonstrate full-stack development skills in a production-style environment.

A full-stack e-commerce application built with Node.js, Express, and MongoDB, demonstrating real-world concepts such as authentication, REST APIs, database integration, and dynamic UI rendering.

Users can browse products, search by category, manage a shopping cart, create accounts, and place orders with persistent storage using MongoDB.

> Note: The README.md file that goes with the project is separetley titled README(project).txt which was included as part of the assignment, but also shows a way to run the project locally (instructions also included at the bottom of this README.md file), along with original project team contributions.


## Live Demo

Play the project here:  
**https://deals-n-discounts.onrender.com/**

> Note: This project is hosted on Render’s free tier, so the first load may take a few seconds while the server wakes up.

---

## Screenshots

### Home Page
![Home](images/screenshots/home.png)

### Product Page
![Product](images/screenshots/product.png)

### Cart Page
![My Cart](images/screenshots/cart.png)

### Login Page
![Login](images/screenshots/login.png)


---

## Features

- Display products from a json file
- Display products by catergory
- Save items to a shopping cart
- Update product stock in a mongodb database
- Save orders to a mongodb database
- Register user accounts
- Authenticate users

---

## Key Technical Highlights

- Designed and implemented a full-stack architecture using Express to serve both frontend and API routes
- Built a RESTful API supporting authentication, products, and order management
- Integrated MongoDB Atlas with Mongoose for persistent, structured data storage
- Implemented JWT-based authentication with protected routes
- Developed a dynamic frontend using vanilla JavaScript and ES modules
- Created a centralized configuration system to eliminate hardcoded API and route values
- Managed client-side state using localStorage and sessionStorage

---

## Authentication

- Secure user registration and login
- JWT-based authentication
- Token stored in localStorage
- Protected routes (orders, dashboard, profile)

---

## Deployment

The application is deployed as a full-stack Node/Express web service on Render.

- Frontend is served from the Express server
- Backend API routes are hosted on the same Render service
- MongoDB Atlas is used for persistent product, user, and order data
- Environment variables are managed through Render

---

## Project Status

This project is deployed as a live portfolio application and is actively maintained. Future improvements may include additional UI polish, admin tools, advanced filtering, and further backend modularization.

---

## Tech Stack

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript (ES Modules)

### Backend
- Node.js
- Express.js

### Database
- MongoDB Atlas
- Mongoose

### Other
- REST APIs
- LocalStorage (cart persistence)
- SessionStorage (checkout flow)

---

## Project Structure
```
├── css
│   ├── index.css
│   ├── login.css
│   ├── order.css
│   ├── products.css
│   └── styles.css
├── images
│   ├── screenshots
│   │   ├── cart.png
│   │   ├── home.png
│   │   ├── login.png
│   │   └── product.png
│   ├── logo.webp
│   ├── product1.jpg
│   ├── product2.jpg
│   ├── product3.jpg
│   ├── ...
│   ├── product98.jpg
│   ├── product99.jpg
│   └── product100.jpg
├── js
│   ├── home.js
│   ├── login.js
│   ├── order.js
│   └── products.js
├── views
│   └── login.ejs
├── app.js
├── index.html
├── LICENSE
├── login.html
├── model_order.js
├── model_product.js
├── model_user.js
├── oldcode.txt
├── order.html
├── package.json
├── products_real_titles.json
├── products.html
├── README.md
├── README(project).txt
├── script.js
├── Sources.txt
└── yarn.lock


```

---

## Running the project
Paste "https://codesandbox.io/p/sandbox/serene-tamas-d6gnqp" in a browser.

If running locally, download the project, and run

```bash
    tar -xf <projectzipfilename>.zip
    npm install yarn --global
    yarn install
    node app.js
```
**CHANGE LATER IF PUT ON REDNER**

---

## Author

Developed by: Ian Swartz 

GitHub: https://github.com/ian-swartz

---

Project Created for Millersville CMSC 421 - Web Application Development

Original CodeSandbox (Group) Share Link: **https://codesandbox.io/p/sandbox/serene-tamas-d6gnqp**

CodeSanbox (Group) Website Link: **https://d6gnqp.csb.app/**

CodeSandbox (Forked) Share Link: **https://codesandbox.io/p/sandbox/finalproject-forked-for-github-p6666c**

CodeSanbox (Forked) Website Link: **https://p6666c.csb.app/**

(CodeSandbox doesn't always load all the images, which I believe may be a server issue).

