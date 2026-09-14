const searchButton = document.getElementById("search-btn");
const foodList = document.getElementById("food-list");
const searchInput = document.getElementById("search-input");
const categoryButtons = document.querySelectorAll(".category-btn");
const foodSearch = document.getElementById("food-search");
const categoryFilter = document.getElementById("category-filter");
const categoryList = document.getElementById("category-list");
const API_URL = "https://qr-menu-nd8d.onrender.com/foods";
const urlParams = new URLSearchParams(window.location.search);
const tableNumber = urlParams.get("table");
const tableNumberText = document.getElementById("table-number");
const cartCount = document.getElementById("cart-count");
const cartBtn = document.getElementById("cart-btn");
const cartModal = document.getElementById("cart-modal");
const closeCartBtn = document.getElementById("close-cart-btn");
const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const placeOrderBtn = document.getElementById("place-order-btn");
const orderStatus = document.getElementById("order-status");
const BACKEND_URL = "https://qr-menu-nd8d.onrender.com";
const socket = io(BACKEND_URL);
if (tableNumber) {
  tableNumberText.textContent = `Table ${tableNumber}`;
}
console.log("Table number:", tableNumber);
let selectedCategory = "";
let editingFoodId = null;
let cart = [];
let currentPage = 1;
let totalPages = 1;
let currentOrderId = localStorage.getItem("currentOrderId");
// let statusInterval = null;
const prevPageBtn = document.getElementById("prev-page-btn");
const nextPageBtn = document.getElementById("next-page-btn");
const pageInfo = document.getElementById("page-info");

socket.on("order-status-updated", (data) => {
  if (data.orderId === currentOrderId) {
    getOrderStatus();
  }
});
searchInput.addEventListener("input", () => {
  getFoods();
});

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    getFoods();
  }
});

searchButton.addEventListener("click", () => {
  currentPage;
  getFoods();
});

placeOrderBtn.addEventListener("click", async () => {
  if (cart.length === 0) {
    alert("Cart is empty");
    return;
  }
  if (!tableNumber) {
    alert("Please scan the QR code on your table.");
    return;
  }
  const orderData = {
    tableNumber: Number(tableNumber),
    items: cart.map((item) => ({
      foodId: item._id,
      quantity: item.quantity,
    })),
  };
  $;
  const response = await fetch(`${BACKEND_URL}/order`, {
    method: "POST",
    headers: { "Content-type": "application/json" },
    body: JSON.stringify(orderData),
  });
  const data = await response.json();
  if (response.ok) {
    currentOrderId = data.order._id;
    localStorage.setItem("currentOrderId", data.order._id);
    getOrderStatus();
    // statusInterval = setInterval(getOrderStatus, 5000);

    console.log("Order amjilttai.");

    cart = [];
    updateCartCount();
    cartModal.classList.remove("show");
  } else {
    alert(data.message);
  }
});

async function getOrderStatus() {
  const response = await fetch(`${BACKEND_URL}/orders/${currentOrderId}`);
  const data = await response.json();

  const status = data.order.status;
  const statusMessages = {
    pending: "Захиалга хүлээн авлаа",
    confirmed: "Захиалга баталгаажлаа",
    preparing: "Захиалгыг бэлдэж байна",
    ready: "Захиалга бэлэн боллоо.",
    completed: "Захиалга амжилттай дууссан.",
  };
  const statusSteps = {
    pending: 0,
    confirmed: 1,
    preparing: 2,
    ready: 3,
    completed: 4,
  };
  console.log("Status check: ", status);
  orderStatus.textContent = statusMessages[status];
  // if (status === "completed") {
  //   clearInterval(statusInterval);
  //   localStorage.removeItem("currentOrderId");
  //   currentOrderId = null;
  // }
}
if (currentOrderId) {
  getOrderStatus();
  // statusInterval = setInterval(getOrderStatus, 5000);
}

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    categoryButtons.forEach((btn) => {
      btn.classList.remove("active");
    });

    button.classList.add("active");

    const category = button.textContent;

    if (category === "All") {
      selectedCategory = "";
    } else {
      selectedCategory = category;
    }
    currentPage = 1;
    getFoods();
  });
});

async function getFoods() {
  try {
    const search = searchInput.value.trim();
    // const category = categoryFilter.value();
    const params = new URLSearchParams();
    params.set("page", currentPage);
    params.set("limit", 6);
    if (search) {
      params.set("search", search);
    }

    if (selectedCategory) {
      params.set("category", selectedCategory);
    }
    const response = await fetch(`${API_URL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error("Foods avch chadsangui");
    }

    const data = await response.json();
    currentPage = data.page;
    totalPages = data.totalPages;
    pageInfo.textContent = `Page ${currentPage} / ${totalPages}`;
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
    renderCategories(data.categories);
    renderFoods(data.foods);
  } catch (error) {
    console.log("Error", error);
  }
}

nextPageBtn.addEventListener("click", () => {
  if (currentPage < totalPages) {
    currentPage++;
    getFoods();
  }
});

prevPageBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    getFoods();
  }
});

function getImageUrl(image) {
  if (!image) {
    return " ";
  }
  if (image.startsWith("http")) {
    return image;
  }
  if (image.startsWith("/uploads/")) {
    return `https://qr-menu-nd8d.onrender.com/foods${image}`;
  }
  if (image.startsWith("uploads/")) {
    return `https://qr-menu-nd8d.onrender.com/${image}`;
  }
  return `https://qr-menu-nd8d.onrender.com/uploads/${image} `;
}

function renderFoods(foods) {
  foodList.innerHTML = "";

  foods.forEach((food) => {
    const card = document.createElement("article");

    card.classList.add("food-card");

    card.innerHTML = `
    ${food.image ? `<img src="${getImageUrl(food.image)}" alt="${food.name}">` : ""}
    <h3>${food.name}</h3>
    <p>${food.description || ""}</p>
    <strong>${food.price.toLocaleString()}₮</strong>
    <button class="add-to-cart-btn">Add to cart</button>`;
    const addToCartBtn = card.querySelector(".add-to-cart-btn");
    addToCartBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      const existingFood = cart.find((item) => item._id === food._id);
      if (existingFood) {
        existingFood.quantity++;
      } else {
        cart.push({
          ...food,
          quantity: 1,
        });
      }
      console.log(cart);
      updateCartCount();

      // const totalQuantity = cart.reduce((total, item) => {
      //   return total + item.quantity;
      // }, 0);
      // cartCount.textContent = totalQuantity;
    });
    card.addEventListener("click", () => {
      showFoodDetail(food);
    });
    foodList.appendChild(card);
  });
}

cartBtn.addEventListener("click", () => {
  renderCart();
  cartModal.classList.add("show");
});
closeCartBtn.addEventListener("click", () => {
  cartModal.classList.remove("show");
});

function renderCategories(categories) {
  categoryList.innerHTML = "";
  const allButton = document.createElement("button");

  allButton.textContent = "All";
  allButton.dataset.category = "";
  allButton.classList.add("category-btn");

  if (!selectedCategory) {
    allButton.classList.add("active");
  }

  categoryList.appendChild(allButton);

  categories.forEach((category) => {
    const button = document.createElement("button");

    button.textContent = category;
    button.dataset.category = category;
    button.classList.add("category-btn");

    if (category === selectedCategory) {
      button.classList.add("active");
    }
    categoryList.appendChild(button);
  });
}

function renderCart() {
  cartItems.innerHTML = "";
  let totalPrice = 0;
  cart.forEach((item) => {
    totalPrice += item.price * item.quantity;
    const cartItem = document.createElement("div");
    cartItem.innerHTML = `
  <p>
  ${item.name} x ${item.quantity} - ${(item.price * item.quantity).toLocaleString()}₮
  </p>
  <button class="increase-btn">+</button>
  <button class="decrease-btn"> - </button>`;
    const increaseBtn = cartItem.querySelector(".increase-btn");
    increaseBtn.addEventListener("click", () => {
      item.quantity++;
      updateCartCount();
      renderCart();
    });

    const decreaseBtn = cartItem.querySelector(".decrease-btn");
    decreaseBtn.addEventListener("click", () => {
      if (item.quantity > 1) {
        item.quantity--;
      } else {
        cart = cart.filter((food) => food._id !== item._id);
      }
      updateCartCount();
      renderCart();
    });

    cartItems.appendChild(cartItem);
  });
  cartTotal.textContent = `${totalPrice.toLocaleString()}₮`;
}

function updateCartCount() {
  const totalQuantity = cart.reduce((total, item) => {
    return total + item.quantity;
  }, 0);
  cartCount.textContent = totalQuantity;
}

categoryList.addEventListener("click", (event) => {
  if (!event.target.classList.contains("category-btn")) {
    return;
  }

  selectedCategory = event.target.dataset.category;
  // currentPage = 1;
  getFoods();
});

function showFoodDetail(food) {
  const modal = document.createElement("div");
  modal.classList.add("food-modal");

  modal.innerHTML = `
<div class="food-modal-content">
<button class="close-modal">&times;</button>

${
  food.image
    ? `<img class="modal-image"  src="${getImageUrl(food.image)}" alt="${food.name}">`
    : ""
}

<h2>${food.name}</h2>
<p>${food.description || ""}</p>
<p>Category: ${food.category}</p>
<strong>${Number(food.price).toLocaleString()}₮</strong>
</div>
`;

  document.body.appendChild(modal);

  const closeButton = modal.querySelector(".close-modal");

  closeButton.addEventListener("click", (event) => {
    event.stopPropagation();
    modal.remove();
  });
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.remove();
    }
  });
}

getFoods();
