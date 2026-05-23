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
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const Order = require("./model_order.js");
const User = require("./model_user.js");
const Product = require("./model_product.js");

const app = express();
const port = process.env.PORT || 5000;
const dbURI = process.env.MONGODB_URI;

// --- DATABASE MIGRATION & SEEDING ---
mongoose.connect(dbURI).then(async () => {
    console.log("Connected to MongoDB.");
    
    // Check if the data is currently a "big chunk" blob
    const existing = await Product.findOne();
    if (existing && existing.items && Array.isArray(existing.items)) {
        console.log("Detected 'Big Chunk' blob. Splitting into individual documents...");
        await Product.insertMany(existing.items);
        await Product.deleteOne({ _id: existing._id });
        console.log("Database split complete.");
    }

    // Seed if empty
    const count = await Product.countDocuments();
    if (count === 0) {
        const raw = fs.readFileSync(path.join(__dirname, "products_real_titles.json"), "utf8");
        const data = JSON.parse(raw);
        await Product.insertMany(data.items);
        console.log(`Seeded ${data.items.length} products.`);
    }
});

// --- MIDDLEWARE ---
app.use(session({
    secret: process.env.SESSION_SECRET || "fallback_secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 1000 }
}));
app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

// --- ROUTES ---
app.post("/orders", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const items = req.body.cart || [];
        
        for (const it of items) {
            // Updated filter to look for the correct index/ID
            const result = await Product.updateOne(
                { "sys.id": String(it.product_id), "fields.stock": { $gte: Number(it.quantity) } },
                { $inc: { "fields.stock": -Number(it.quantity) } },
                { session }
            );

            if (result.matchedCount === 0) {
                throw new Error(`Product ${it.product_id} not found or out of stock.`);
            }
        }

        const order = new Order({ user_id: req.user._id, items, timestamp: new Date() });
        await order.save({ session });
        
        await session.commitTransaction();
        res.status(201).json({ message: "Order confirmed." });
    } catch (err) {
        await session.abortTransaction();
        res.status(409).json({ message: err.message });
    } finally {
        session.endSession();
    }
});

// Other existing routes (login, register, products, etc.) remain here...
app.listen(port, () => console.log(`Server running on port ${port}`));
