/*
 * Filename: app.js
 * Authors: Collin Donnan, John Hershey, Jacob Karasow, Ian Swartz
 * Creation Date: 2025-11-14
 * Last Edit Date: 2026-05-23
 * Description: Contains code for accessing and running website backend.
 */

require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");

const Order = require("./model_order.js");
const User = require("./model_user.js");
const Product = require("./model_product.js");
const app = express();

const port = process.env.PORT || 5000;
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const dbURI = process.env.MONGODB_URI;

if (!dbURI) {
  console.error("CRITICAL ERROR: MONGODB_URI environment variable is missing!");
  process.exit(1);
}

mongoose.connect(dbURI)
  .then(async () => {
    console.log("Connected to MongoDB Atlas successfully.");

    try {
      const count = await Product.countDocuments();
      
      // FIX: Handle "Big Chunk" vs individual docs
      const existing = await Product.findOne();
      if (existing && existing.items && Array.isArray(existing.items)) {
          console.log("Found 'Big Chunk' detected. Splitting into individual documents...");
          await Product.insertMany(existing.items);
          await Product.deleteOne({ _id: existing._id });
          console.log("Database split completed.");
      }

      const newCount = await Product.countDocuments();
      if (newCount === 0) {
        console.log("Seeding from products_real_titles.json...");
        const raw = fs.readFileSync(path.join(__dirname, "products_real_titles.json"), "utf8");
        const data = JSON.parse(raw);
        await Product.insertMany(data.items);
        console.log(`Seeded ${data.items.length} products.`);
      }
    } catch (seedErr) {
      console.error("Error seeding product collection:", seedErr);
    }
  })
  .catch((err) => console.error("Database connection failed:", err));

app.use(session({
  secret: process.env.SESSION_SECRET || "grwgq3480430ufddj",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60 * 60 * 1000, secure: false, sameSite: "lax" },
}));

app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// --- Auth Routes ---
app.get("/logout", (req, res, next) => {
  req.logout((err) => { err ? next(err) : res.redirect("/login"); });
});

app.post("/register", (req, res, next) => {
  if (req.body.pwrd != req.body.repwrd) return next("passwords do not match");
  User.register({ username: req.body.email, name: `${req.body.fname} ${req.body.lname}`, date: Date() }, req.body.pwrd, (err) => {
    if (err) return next(err);
    res.redirect("/");
  });
});

app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user) => {
    if (err) return next(err);
    if (!user) return res.render("login.ejs", { message: "Invalid username or password." });
    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.redirect("/");
    });
  })(req, res, next);
});

app.get("/login", (req, res) => res.sendFile(__dirname + "/index.html"));

app.get("/user", connectEnsureLogin.ensureLoggedIn(), (req, res) => res.send({ user: req.user }));

// --- Product Routes ---
app.get("/products", async (req, res) => {
  try {
    const { category, sort } = req.query;
    let queryFilter = category ? { "fields.category": category } : {};
    let productQuery = Product.find(queryFilter);
    
    // Sorting logic
    const sortMap = { "price_asc": { "fields.price": 1 }, "price_desc": { "fields.price": -1 }, "title_asc": { "fields.title": 1 } };
    if (sortMap[sort]) productQuery = productQuery.sort(sortMap[sort]);
    
    res.json(await productQuery.exec());
  } catch (error) {
    res.status(500).json({ message: "Failed to get storefront items." });
  }
});

// --- Order Routes ---
app.post("/orders", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const items = (req.body.cart ?? []).map(item => ({
      product_id: String(item.product_id), // Ensure string for matching
      quantity: Number(item.quantity),
      price: Number(item.price)
    }));

    const order = new Order({ user_id: req.user._id.toString(), items, timestamp: new Date() });
    await order.save({ session });

    // FIX: Using an index-based ID match (since JSON uses array position)
    for (const it of items) {
      const updateResult = await Product.updateOne(
        { "sys.id": it.product_id, "fields.stock": { $gte: it.quantity } },
        { $inc: { "fields.stock": -it.quantity } },
        { session }
      );

      if (updateResult.modifiedCount === 0) {
        throw new Error("Insufficient stock or product not found");
      }
    }

    await session.commitTransaction();
    res.status(201).json({ message: "Order successful." });
  } catch (error) {
    await session.abortTransaction();
    res.status(409).json({ message: error.message });
  } finally {
    session.endSession();
  }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
