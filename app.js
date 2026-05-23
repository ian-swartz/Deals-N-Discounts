/*
 * Filename: app.js
 * Authors: Collin Donnan, John Hershey, Jacob Karasow
 * Creation Date: 2025-11-14
 * Last Edit Date: 2026-05-22
 * Class: CMSC 421 Web Development
 * Description: contains code for accessing and running website backend securely configured for Render
 */

// 1. MUST BE AT THE VERY TOP: Load environment variables from your secure local .env file or Render settings
require('dotenv').config();

const express = require("express"); // Import the Express framework – used to build the web server
const bodyParser = require("body-parser"); // Middleware that helps parse data sent from forms (POST requests)
const session = require("express-session"); // Middleware for creating and managing user sessions (stores who’s logged in)
const passport = require("passport"); // Authentication library – handles login and verifying credentials
const connectEnsureLogin = require("connect-ensure-login"); // Middleware to protect pages so only logged-in users can access them

const Order = require("./model_order.js"); // Import the Order model defined in model_order.js
const User = require("./model_user.js"); // Import the User model defined in model.js (includes schema + passport-local-mongoose setup)
const Product = require("./model_product.js"); // import the product
const app = express(); // Create an instance of an Express application

// 2. DYNAMIC PORT: Use Render's production environment port variable, falling back to 5000 locally
const port = process.env.PORT || 5000;

const fs = require("fs");
const path = require("path");

// Connect to Mongoose to create ordering sessions
const mongoose = require("mongoose");

// 3. SECURE DATABASE CONNECTION: Pull connection string securely from the environment variable
const dbURI = process.env.MONGODB_URI;

if (!dbURI) {
  console.error("CRITICAL ERROR: MONGODB_URI environment variable is missing!");
  process.exit(1);
}

mongoose.connect(dbURI)
  .then(() => console.log("Connected to MongoDB Atlas successfully."))
  .catch((err) => console.error("Database connection failed:", err));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "grwgq3480430ufddj", // Secure option fallback
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 1000, secure: false, sameSite: "lax" }, // 1 hour
  })
);

// ****************** FILE LOADING *******************************
app.use(express.static(__dirname));

// ********************* MIDDLEWARE  **************************
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ************************* USER AUTH *******************************
app.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
});

app.post("/register", function (req, res, next) {
  let passmiss = "passwords do not match";
  if (req.body.pwrd != req.body.repwrd) {
    console.log("error while user register!", passmiss);
    return next(passmiss);
  }
  User.register(
    {
      username: req.body.email,
      name: `${req.body.fname} ${req.body.lname}`,
      date: Date(),
    },
    req.body.pwrd,
    function (err) {
      if (err) {
        console.log("error while user register!", err);
        return next(err);
      }
      console.log("user registered!");
      res.redirect("/"); // After successful registration, go back to login page
    }
  );
});

app.get("/login.html", (req, res) => {
  res.render("login.ejs", { message: "" });
});

app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.render("login.ejs", {
        message: "Invalid username or password.",
      });
    }
    req.logIn(user, (err) => {
      if (err) return next(err);
      // FIX: Redirect directly to the storefront root instead of back to login layout
      return res.redirect("/");
    });
  })(req, res, next);
});

app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/user", connectEnsureLogin.ensureLoggedIn(), (req, res) =>
  res.send({ user: req.user })
);

// ************************* ORDERS TO DATABASE *******************************
app.post("/orders", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const items = (req.body.cart ?? []).map((item) => ({
      product_id: item.product_id,
      quantity: Number(item.quantity),
      price_cents: Math.round(Number(item.price) * 100),
    }));

    const order = new Order({
      user_id: req.user._id.toString(),
      items,
      timestamp: new Date(),
    });
    await order.save({ session });

    const bulkOps = items.map((it) => ({
      updateOne: {
        filter: {
          "sys.id": String(it.product_id),
          "fields.stock": { $gte: it.quantity },
        },
        update: {
          $inc: { "fields.stock": -it.quantity },
        },
      },
    }));

    const bulkResult = await Product.bulkWrite(bulkOps, { session });

    const matched = bulkResult.result?.nMatched ?? bulkResult.matchedCount ?? 0;
    const modified = bulkResult.result?.nModified ?? bulkResult.modifiedCount ?? 0;

    if (matched !== items.length || modified !== items.length) {
      await session.abortTransaction();
      return res.status(409).json({
        message: "Insufficient stock for one or more items.",
        details: { matched, modified, expected: items.length },
      });
    }

    await session.commitTransaction();

    updateProductStock(items);

    res.status(201).json({ message: "Order saved and stock updated." });
  } catch (error) {
    console.error(error);
    await session.abortTransaction();
    res.status(500).json({ message: "Failed to save order or update stock." });
  } finally {
    session.endSession();
  }
});

async function updateProductStock(cartItems) {
  try {
    const productsFilePath = path.join(__dirname, "products_real_titles.json");

    const raw = fs.readFileSync(productsFilePath, "utf8");
    const data = JSON.parse(raw);

    cartItems.forEach((item) => {
      const product = data.items.find(
        (p) => String(p.sys.id) === String(item.product_id)
      );

      if (product && product.fields.stock >= item.quantity) {
        product.fields.stock -= item.quantity;
      }
    });

    fs.writeFileSync(productsFilePath, JSON.stringify(data, null, 2));
    console.log("JSON stock updated.");
  } catch (err) {
    console.error("Error updating JSON stock:", err);
  }
}

// ************************* RUN THE SERVER ***********************
app.listen(port, () => {
  console.log(`Server is running dynamically on port ${port}`);
});
