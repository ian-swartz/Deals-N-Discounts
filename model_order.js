/*
 * Filename: model_order.js
 * Authors: Ian Swartz
 * Creation Date: 2025-11-11
 * Last Edit Date: 2026-05-23
 * Class: CMSC 421 Web Development
 * Description: code for mongodb order schema part of website, based on Dr X's example
 */

const mongoose = require("mongoose");

// REMOVED THE HARDCODED CONNECT STRING THAT WAS HIJACKING THE ROUTE

const Schema = mongoose.Schema;

const OrderSchema = new Schema({
  user_id: {
    type: String,
    required: true,
  },

  items: [
    {
      product_id: { type: Number, required: true },
      quantity: { type: Number, required: true },
      price_cents: { type: Number, required: true },
    },
  ],

  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("orderinfos", OrderSchema);
