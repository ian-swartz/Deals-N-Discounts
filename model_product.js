/*
 * Filename: model_product.js
 * Authors: Ian Swartz
 * Creation Date: 2025-11-11
 * Last Edit Date: 2026-05-23
 * Class: CMSC 421 Web Development
 * Description: code for mongodb product schema part of website, based on Dr X's example
 */

const mongoose = require("mongoose");

// REMOVED THE HARDCODED CONNECT STRING THAT WAS HIJACKING THE ROUTE

// Define schema matching the JSON structure
const Product = new mongoose.Schema({
  sys: {
    id: { type: String, required: true, unique: true },
  },
  fields: {
    title: { type: String, required: true },
    price: { type: Number, required: true },
    image: {
      fields: {
        file: {
          url: { type: String, required: true },
        },
      },
    },
    description: { type: String, required: true },
    category: { type: String, required: true },
    stock: { type: Number, required: true },
    rating: { type: Number, required: true },
    brand: { type: String, required: true },
    details: { type: mongoose.Schema.Types.Mixed, required: true },
  },
});

module.exports = mongoose.model("products", Product);
