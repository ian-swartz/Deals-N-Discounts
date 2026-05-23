/*
 * Filename: order.js
 * Authors: Tanner Ness, Jacob Karasow, Ian Swartz
 * Creation Date: 2025-10-21
 * Last Edit Date: 2026-05-23
 * Class: CMSC 421 Web Development
 * Description: JS file for order/cart page, updated for DB compatibility
 */

const order_list_div = document.getElementById("order-list");
const total_span = document.getElementById("total");
const total_value_div = document.getElementById("total-value");
const summary_h1 = document.getElementById("summary");
const confirm_order_button = document.getElementById("confirm");
const clear_cart = document.getElementById("clear-cart");

var isHidden = false;
var empty_cart = true;
var order_confirmed = false;
var total = 0;

let storedCart = JSON.parse(localStorage.getItem("cart")) || [];
var cart_list = [];

// Fetch product data from the database route
fetch("/products")
  .then((response) => response.json())
  .then((data) => {
    // Map database items (array of 100 products)
    storedCart.forEach((id) => {
      const product = data.find((p) => String(p.sys.id) === String(id));
      if (product) {
        let title = product.fields.title;
        let price = product.fields.price;
        let stock = product.fields.stock;
        let imagePath = product.fields.image?.fields?.file?.url || "../images/placeholder.jpg";

        if (stock === 0) return;

        let existing = cart_list.find((p) => p[0] === title);
        if (existing) {
          if (existing[3] < existing[4]) existing[3] += 1;
        } else {
          cart_list.push([title, price, imagePath, 1, stock, id]);
        }
      }
    });

    check_is_empty();
    displayProducts();
  })
  .catch((err) => {
    console.error("Error loading product data:", err);
    check_is_empty();
  });

function check_is_empty() {
  const isNowEmpty = cart_list.length === 0;
  total_value_div.hidden = isNowEmpty;
  confirm_order_button.hidden = isNowEmpty;
  clear_cart.hidden = isNowEmpty;
  summary_h1.style.display = isNowEmpty ? "none" : "block";
  isHidden = isNowEmpty;
  empty_cart_text();
}

function empty_cart_text() {
  const alt = document.getElementById("empty-cart");
  if (alt) alt.hidden = !(isHidden && !order_confirmed);
}

function displayProducts() {
  cart_list.forEach((prod) => createProduct(prod));
  getTotalCartCost();
}

function createProduct(a_product) {
  const item = document.createElement("div");
  item.className = "item";
  item.id = "item-" + a_product[0];

  if (a_product[4] === 0) {
    item.style.opacity = "0.5";
    item.style.pointerEvents = "none";
  }

  item.innerHTML = `
    <div class="product">
      <img src="${a_product[2]}" width="150" height="200" alt="${a_product[0]}">
      <div class="product-info">
        <h3>${a_product[0]}</h3>
        <h4>Price: $<span id="price">${a_product[1]}</span></h4>
        <p id="remove">remove</p>
      </div>
    </div>
    <div class="increase-decrease-amount">
      <div id="increment"><i class="fa-solid fa-square-caret-up"></i></div>
      <span id="quantity-${a_product[0]}">${a_product[3]}</span>
      <div id="decrement"><i class="fa-solid fa-square-caret-down"></i></div>
    </div>
  `;

  item.querySelector("#remove").addEventListener("click", () => remove_from_cart(a_product));
  item.querySelector("#increment").addEventListener("click", () => increment(a_product));
  item.querySelector("#decrement").addEventListener("click", () => decrement(a_product));

  order_list_div.appendChild(item);
}

function getTotalCartCost() {
  total = cart_list.reduce((acc, p) => acc + (p[1] * p[3]), 0);
  total_span.innerHTML = total.toFixed(2);
}

function increment(product) {
  if (product[3] < product[4]) {
    product[3]++;
    document.getElementById("quantity-" + product[0]).innerHTML = product[3];
    updateLocalStorage();
    getTotalCartCost();
  }
}

function decrement(product) {
  product[3]--;
  if (product[3] <= 0) {
    remove_from_cart(product);
  } else {
    document.getElementById("quantity-" + product[0]).innerHTML = product[3];
    updateLocalStorage();
    getTotalCartCost();
  }
}

function remove_from_cart(product) {
  document.getElementById("item-" + product[0]).remove();
  cart_list = cart_list.filter(p => p !== product);
  check_is_empty();
  getTotalCartCost();
  updateLocalStorage();
}

function clear_cart_order() {
  cart_list = [];
  order_list_div.innerHTML = "";
  localStorage.removeItem("cart");
  check_is_empty();
  total_span.innerHTML = "0.00";
}

function updateLocalStorage() {
  const ids = [];
  cart_list.forEach(p => {
    for (let i = 0; i < p[3]; i++) ids.push(p[5]);
  });
  localStorage.setItem("cart", JSON.stringify(ids));
}

async function confirm_order() {
  try {
    const userCheck = await fetch("/user", { credentials: "include" });
    if (!userCheck.ok) { window.location.href = "/login.html"; return; }

    // Prepare payload using the string ID stored in p[5]
    const cart_data = cart_list.map((product) => ({
      product_id: String(product[5]), // Force ID to String
      quantity: product[3],
      price: product[1],
    }));

    const response = await fetch("/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart: cart_data }),
      credentials: "include",
    });

    if (response.ok) {
      order_confirmed = true;
      confirmation_popup();
      clear_cart_order();
    } else {
      alert("Failed to confirm order. Please try again.");
    }
  } catch (error) {
    console.error("Error confirming order:", error);
  }
}

function confirmation_popup() {
  const div = document.getElementById("order-confirmed");
  if (div) div.hidden = false;
}

clear_cart.addEventListener("click", clear_cart_order);
confirm_order_button.addEventListener("click", confirm_order);
