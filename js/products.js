/*
 * Filename: products.js
 * Authors: Jacob Karasow, Ian Swartz, John Hershey
 * Creation Date: 2025-10-21
 * Last Edit Date: 2026-05-23
 * Class: CMSC 421 Web Development
 * Description: JS file for products page - API-driven with defensive mapping
 */

document.addEventListener("DOMContentLoaded", function () {
  // -----------------------------------
  // GET PRODUCT ID FROM URL
  // -----------------------------------
  const urlParams = new URLSearchParams(window.location.search);
  const productId = parseInt(urlParams.get("id"), 10);

  // -----------------------------------
  // PAGE SECTIONS
  // -----------------------------------
  const noProductMessage = document.getElementById("noProductMessage");
  const productGrid = document.getElementById("productGrid");
  const recommendedSection = document.getElementById("recommendedSection");
  const recommendedGrid = document.getElementById("recommendedGrid");

  // -----------------------------------
  // FETCH PRODUCT LIST FROM API
  // -----------------------------------
  fetch("/products")
    .then((response) => response.json())
    .then((data) => {
      // Defensive mapping to handle both nested 'fields' or flat database objects
      const products = data.map((item, index) => {
        const source = item.fields ? item.fields : item;
        
        return {
          id: index + 1,
          title: source.title || "No Title",
          price: source.price || 0,
          category: source.category || "General",
          description: source.description || "",
          stock: source.stock || 0,
          image: source.image?.fields?.file?.url || "../images/placeholder.jpg",
        };
      });

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
      const product = products[productId - 1];
      if (!product) {
        noProductMessage.innerHTML = "<h2>Product Not Found</h2>";
        noProductMessage.classList.remove("hidden");
        productGrid.classList.add("hidden");
        recommendedSection.classList.add("hidden");
        return;
      }

      noProductMessage.classList.add("hidden");
      productGrid.classList.remove("hidden");

      // Fill product details
      document.getElementById("productTitle").innerHTML = `<h2>${product.title}</h2>`;
      document.getElementById("productPrice").textContent = `$${product.price.toFixed(2)}`;
      document.getElementById("productDescription").textContent = product.description;
      document.getElementById("productStock").textContent = `In Stock: ${product.stock}`;
      document.getElementById("productCategory").textContent = `Category: ${product.category}`;

      // Image Handling
      document.getElementById("productImage").innerHTML = `
        <img src="${product.image}" alt="${product.title}" 
             onerror="this.src='../images/placeholder.jpg'">
      `;

      // ADD TO CART
      const addButton = document.getElementById("addToCart");
      if (product.stock > 0) {
        addButton.onclick = function () {
          let cart = JSON.parse(localStorage.getItem("cart") || "[]");
          cart.push(product.id);
          localStorage.setItem("cart", JSON.stringify(cart));
          showToast(`Added "${product.title}" to cart`);
        };
      } else {
        addButton.innerText = "Out of Stock";
        addButton.style.backgroundColor = "red";
        addButton.disabled = true;
      }

      renderRecommendedProducts(products, product);
    })
    .catch((err) => {
      console.error("Failed to load products:", err);
      noProductMessage.innerHTML = "<h2>Error Loading Products</h2>";
      noProductMessage.classList.remove("hidden");
      recommendedSection.classList.add("hidden");
    });

  // -----------------------------------
  // FUNCTIONS
  // -----------------------------------
  function renderRecommendedProducts(products, currentProduct) {
    recommendedSection.classList.remove("hidden");
    recommendedGrid.innerHTML = "";
    let suggestions = currentProduct ? products.filter((p) => p.id !== currentProduct.id) : products;
    suggestions = [...suggestions].sort(() => Math.random() - 0.5).slice(0, 8);

    suggestions.forEach((prod) => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `<h4><a href="products.html?id=${prod.id}">${prod.title}</a></h4><p>$${prod.price.toFixed(2)}</p>`;
      card.onclick = () => { window.location.href = "products.html?id=" + prod.id; };
      recommendedGrid.appendChild(card);
    });
  }

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
