/*
 * Author: John Hershey, Collin Donnan, Ian Swartz
 * Creation Date: 2025-11-11
 * Last Edit Date: 2026-05-23
 * Class: CMSC 421 Web Development
 * Description: code for mongodb login schema part of website, based on Dr X's example
 */
const passportLocalMongoose = require("passport-local-mongoose");
const mongoose = require("mongoose");

// REMOVED THE HARDCODED CONNECT STRING THAT WAS HIJACKING THE ROUTE

const Schema = mongoose.Schema;

const User = new Schema({
  username: String,
  name: String,
  date: String,
});
User.plugin(passportLocalMongoose);

// This exports the model so app.js can use the existing MONGODB_URI connection
module.exports = mongoose.model("userinfos", User);
