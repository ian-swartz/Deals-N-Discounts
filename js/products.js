/*
 * Filename: products.js
 * Authors: Jacob Karasow, Ian Swartz, John Hershey
 * Creation Date: 2025-10-21
 * Last Edit Date: 2026-05-23
 * Class: CMSC 421 Web Application Development
 * Description: JS file for products page connected to the MongoDB backend API
 *
 */

document.addEventListener("DOMContentLoaded", function () {
  // -----------------------------------
  // GET PRODUCT ID FROM URL
  // -----------------------------------
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id"); // Kept as a string to match MongoDB/JSON sys.id format

  // -----------------------------------
  // PAGE SECTIONS
  // -----------------------------------
  const noProductMessage = document.getElementById("noProductMessage");
  const productGrid = document.getElementById("productGrid");
  const recommendedSection = document.getElementById("recommendedSection");
  const recommendedGrid = document.getElementById("recommendedGrid");

  // -----------------------------------
  // FETCH PRODUCT LIST FROM MONGODB BACKEND
  // -----------------------------------
  fetch("/products")
    .then((response) => response.json())
    .then((dbItems) => {
      // Map database schema elements to structured frontend objects
      const products = dbItems.map((item) => ({
        id: String(item.sys.id), // Persist true unique identifier string for orders
        title: item.fields.title,
        price: item.fields.price,
        category: item.fields.category,
        description: item.fields.description || "",
        stock: item.fields.stock ?? 0,
        // Pull path dynamically from schema definition or default to custom placeholder
        image: item.fields.image?.fields?.file?.url || '../images/placeholder.jpg', 
      }));

      // -----------------------------------
      // NO PRODUCT SELECTED
      // -----------------------------------
      if (!productId) {
        noProductMessage.classList.remove("hidden");
        productGrid.classList.add("hidden");

        renderRecommendedProducts(products, null);
        return;
      }

      // -----------------------------------
      // PRODUCT SELECTED
      // -----------------------------------
      // Use array find to locate the string-based sys.id
      const product = products.find((p) => p.id === String(productId));
      
      if (!product) {
        noProductMessage.innerHTML = "<h2>Product Not Found</h2>";
        noProductMessage.classList.remove("hidden");
        productGrid.classList.add("hidden");
        recommendedSection.classList.add("hidden");
        return;
      }

      // Hide no product message
      noProductMessage.classList.add("hidden");
      productGrid.classList.remove("hidden");

      // Fill product details
      document.getElementById(
        "productTitle"
      ).innerHTML = `<h2>${product.title}</h2>`;
      document.getElementById(
        "productPrice"
      ).textContent = `$${product.price.toFixed(2)}`;
      document.getElementById("productDescription").textContent =
        product.description;
      document.getElementById(
        "productStock"
      ).textContent = `In Stock: ${product.stock}`;
      document.getElementById(
        "productCategory"
      ).textContent = `Category: ${product.category}`;

      // -----------------------------------
      // MAIN PRODUCT IMAGE
      // -----------------------------------
      document.getElementById("productImage").innerHTML = `
        <img src="${product.image}" 
             alt="${product.title}" 
             onerror="this.src='../images/placeholder.jpg'">
      `;

      // -----------------------------------
      // ADD TO CART
      // -----------------------------------
      const addButton = document.getElementById("addToCart");
      if (product.stock > 0) {
        // Clone button to drop old stale event listeners on page re-renders
        const newAddButton = addButton.cloneNode(true);
        addButton.parentNode.replaceChild(newAddButton, addButton);

        newAddButton.addEventListener("click", function () {
          let cart = JSON.parse(localStorage.getItem("cart") || "[]");
          // Pushes the genuine sys.id string so the database transaction can locate it later
          cart.push(product.id);
          localStorage.setItem("cart", JSON.stringify(cart));
          showToast(`Added "${product.title}" to cart`);
        });
      } else {
        addButton.innerText = "Out of Stock";
        addButton.style.backgroundColor = "red";
      }

      // -----------------------------------
      // RECOMMENDED PRODUCTS
      // -----------------------------------
      renderRecommendedProducts(products, product);
    })
    .catch((err) => {
      console.error("Failed to load products from database:", err);
      noProductMessage.innerHTML = "<h2>Error Loading Products</h2>";
      noProductMessage.classList.remove("hidden");
      recommendedSection.classList.add("hidden");
    });

  // =========================================================
  // FUNCTION: RENDER RECOMMENDED PRODUCTS
  // =========================================================
  function renderRecommendedProducts(products, currentProduct) {
    recommendedSection.classList.remove("hidden");
    recommendedGrid.innerHTML = "";

    let suggestions = currentProduct
      ? products.filter((p) => p.id !== currentProduct.id)
      : products;

    // Shuffle and pick 8 products
    suggestions = [...suggestions].sort(() => Math.random() - 0.5).slice(0, 8);

    // Render each product (name + price only)
    suggestions.forEach((prod) => {
      const card = document.createElement("div");
      card.className = "product-card";

      card.innerHTML = `
        <h4><a href="products.html?id=${prod.id}">${prod.title}</a></h4>
        <p>$${prod.price.toFixed(2)}</p>
      `;

      card.addEventListener("click", () => {
        window.location.href = "products.html?id=" + prod.id;
      });

      recommendedGrid.appendChild(card);
    });
  }

  // =========================================================
  // TOAST POPUP SYSTEM
  // =========================================================
  const toastContainer = document.createElement("div");
  toastContainer.id = "toast-container";
  document.body.appendChild(toastContainer);

  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast-message";
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("fade-out");
      toast.addEventListener("transitionend", () => toast.remove());
    }, 2000);
  }
});
