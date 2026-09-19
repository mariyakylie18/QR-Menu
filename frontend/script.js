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
const cartTotalbtn = document.getElementById("cart-total-btn");
const placeOrderBtn = document.getElementById("place-order-btn");
const orderStatus = document.getElementById("order-status");
const BACKEND_URL = "https://qr-menu-nd8d.onrender.com";
const socket = io(BACKEND_URL);
const customerHistoryBtn = document.getElementById("customer-history-btn");
const customerHistoryModal = document.getElementById("customer-history-modal");
const customerHistoryItems = document.getElementById("customer-history-items");
const closeCustomerHistoryBtn = document.getElementById(
  "close-customer-history-btn",
);
// socket.on("connect", () => {
//   if (currentOrderId) {
//     socket.emit("join-order", currentOrderId);
//   }
// });
if (tableNumber) {
  tableNumberText.textContent = `Ширээ ${tableNumber}`;
}
console.log("Table number:", tableNumber);
let selectedCategory = "";
let editingFoodId = null;
let cart = [];
let currentPage = 1;
let totalPages = 1;
let currentOrderId = localStorage.getItem(
  `currentOrderId_table_${tableNumber}`,
);
let trackingToken = localStorage.getItem(`trackingToken_table_${tableNumber}`);
socket.on("connect", () => {
  if (currentOrderId) {
    socket.emit("join-order", {
      orderId: currentOrderId,
      trackingToken,
    });
  }
});

const ORDER_HISTORY_TTL = 12 * 60 * 60 * 1000;
const ORDER_HISTORY_KEY = `qr-order-history-${tableNumber || "unknown"}`;
// let statusInterval = null;
let selectedType = "food";
const typeButtons = document.querySelectorAll(".type-btn");
const prevPageBtn = document.getElementById("prev-page-btn");
const nextPageBtn = document.getElementById("next-page-btn");
const pageInfo = document.getElementById("page-info");
typeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedType = button.dataset.type;
    selectedCategory = "";
    typeButtons.forEach((btn) => {
      btn.classList.remove("active");
    });
    button.classList.add("active");
    getFoods();
  });
});

socket.on("order-status-updated", (data) => {
  console.log("SOcket status event:", data);
  if (data.orderId === currentOrderId) {
    getOrderStatus();
    if (data.status === "completed") {
      localStorage.removeItem("currentOrderId");
      localStorage.removeItem("trackingToken");
      currentOrderId = null;
      trackingToken = null;
    }
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
  const response = await fetch(`${BACKEND_URL}/orders`, {
    method: "POST",
    headers: { "Content-type": "application/json" },
    body: JSON.stringify(orderData),
  });
  const data = await response.json();

  if (response.ok) {
    currentOrderId = data.order._id;
    localStorage.setItem(`currentOrderId_table_${tableNumber}`, data.order._id);
    trackingToken = data.order.trackingToken;
    localStorage.setItem(
      `trackingToken_table_${tableNumber}`,
      data.order.trackingToken,
    );
    saveOrderToHistory(data.order._id, data.order.trackingToken);

    socket.emit("join-order", {
      orderId: currentOrderId,
      trackingToken,
    });

    currentOrderId = data.order._id;
    trackingToken = data.order.trackingToken;
    sessionStorage.setItem("currentOrderId", currentOrderId);
    sessionStorage.setItem("trackingToken", trackingToken);
    saveOrderToHistory(data.order._id, data.order.trackingToken);

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
  const response = await fetch(
    `${BACKEND_URL}/orders/${currentOrderId}?trackingToken=${trackingToken}`,
  );
  const data = await response.json();

  const status = data.order.status;
  const statusMessages = {
    pending: "Захиалга хүлээн авлаа",
    confirmed: "Захиалга баталгаажлаа",
    preparing: "Захиалгыг бэлдэж байна",
    ready: "Захиалга бэлэн боллоо.",
    completed:
      "Захиалга амжилттай дууслаа. Та кассан дээр тооцоогооо хийнэ үү.",
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
  if (status === "completed") {
    localStorage.removeItem(`currentOrderId_table_${tableNumber}`);
    localStorage.removeItem(`trackingToken_table_${tableNumber}`);
    currentOrderId = null;
    trackingToken = null;
  }
}
if (currentOrderId) {
  getOrderStatus();
} else {
  orderStatus.textContent = "";
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
    if (selectedType) {
      params.set("type", selectedType);
    }
    params.set("page", currentPage);
    params.set("limit", 6);
    if (search) {
      params.set("search", search);
    }

    if (selectedCategory) {
      params.set("category", selectedCategory);
    }
    console.log(params.toString());
    const response = await fetch(`${BACKEND_URL}/foods?${params}`);

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
  const availableFoods = foods.filter((food) => food.isAvailable !== false)
  foodList.innerHTML = "";
   availableFoods.forEach((food) => {
    const card = document.createElement("article");

    card.classList.add("food-card");

    card.innerHTML = `
    ${food.image ? `<img src="${getImageUrl(food.image)}" alt="${food.name}">` : ""}
    <h3>${food.name}</h3>
    <p>${food.description || ""}</p>
    <strong>${food.price.toLocaleString()}₮</strong>
    <button class="add-to-cart-btn"> 🛒 Сагсанд хийх</button>`;
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

    cartItem.classList.add("cart-item");
    cartItem.innerHTML = `
   <div class="cart-item-info">
   <h3>${item.name}</h23>
   <p class="cart-item-price">
   ${(item.price * item.quantity).toLocaleString()}₮
   </p>
   </div>
   <div class="cart-quantity">
   <button class="decrease-btn">-</button>
   <span>${item.quantity}</span>
   <button class="increase-btn">+</button>
   </div>
   `;

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
  // cartTotalbtn.textContent = `${totalPrice.toLocaleString()}₮`;
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

function getOrderHistoryRefs() {
  try {
    return JSON.parse(sessionStorage.getItem(ORDER_HISTORY_KEY)) || [];
  } catch (error) {
    console.log("History read error:", error);
    return [];
  }
}

function saveOrderToHistory(orderId, trackingToken) {
  let history = getOrderHistoryRefs();

  const alreadyExist = history.some((item) => item.orderId === orderId);
  if (alreadyExist) return;

  history.unshift({
    orderId,
    trackingToken,
    savedAt: Date.now(),
  });

  sessionStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(history));
}

async function loadCustomerHistory() {
  const history = getOrderHistoryRefs();

  console.log("HISTORY:", history);

  customerHistoryItems.innerHTML = "";

  if (history.length === 0) {
    customerHistoryItems.innerHTML =
      "<p class='empty-history'>Одоогоор захиалгын түүх алга.</p>";
    return;
  }

  const statusMessages = {
    pending: "Хүлээн авсан",
    confirmed: "Баталгаажсан",
    preparing: "Бэлтгэж байна",
    ready: "Бэлэн болсон",
    completed: "Үйлчилгээ дууссан",
  };

  for (const item of history) {
    try {
      const response = await fetch(
        `${BACKEND_URL}/orders/${item.orderId}?trackingToken=${encodeURIComponent(
          item.trackingToken,
        )}`,
      );

      if (!response.ok) {
        console.log("History fetch status:", response.status);
        continue;
      }

      const data = await response.json();
      const order = data.order;

      const card = document.createElement("div");
      card.classList.add("customer-history-card");

      const foodsHtml = order.items
        .map(
          (food) => `
            <div class="history-food-row">
              <span>${food.name} × ${food.quantity}</span>

              <strong>
                ${(food.price * food.quantity).toLocaleString()}₮
              </strong>
            </div>
          `,
        )
        .join("");

      card.innerHTML = `
        <div class="history-order-header">
          <strong>Ширээ ${order.tableNumber}</strong>

          <span class="history-status status-${order.status}">
            ${order.status}
          </span>
        </div>

        <div class="history-foods">
          ${foodsHtml}
        </div>

        <div class="history-total">
          <span>Нийт</span>
          <strong>${order.totalPrice.toLocaleString()}₮</strong>
        </div>
      `;

      customerHistoryItems.appendChild(card);
    } catch (error) {
      console.log("History error:", error);
    }
  }
}

function renderCustomerOrderHistory(orders) {
  customerHistoryItems.innerHTML = "";

  if (orders.length === 0) {
    customerHistoryItems.innerHTML =
      '<p class="empty-history">Одоогоор захиалга алга.</p>';

    return;
  }

  const statusMessages = {
    pending: "Хүлээн авсан",
    confirmed: "Баталгаажсан",
    preparing: "Бэлтгэж байна",
    ready: "Бэлэн болсон",
    completed: "Үйлчилгээ дууссан",
  };

  orders.forEach((order, index) => {
    const orderCard = document.createElement("div");

    orderCard.classList.add("customer-history-card");

    const itemsHtml = order.items
      .map((item) => {
        return `
          <div class="history-food-row">
            <span>${item.name} × ${item.quantity}</span>

            <strong>
              ${(item.price * item.quantity).toLocaleString()}₮
            </strong>
          </div>
        `;
      })
      .join("");

    const orderTime = new Date(order.createdAt).toLocaleString();

    orderCard.innerHTML = `
      <div class="history-order-header">
        <div>
          <span class="history-order-number">
            Захиалга ${orders.length - index}
          </span>

          <small>${orderTime}</small>
        </div>

        <span class="history-status status-${order.status}">
          ${statusMessages[order.status] || order.status}
        </span>
      </div>

      <div class="history-foods">
        ${itemsHtml}
      </div>

      <div class="history-total">
        <span>Нийт</span>

        <strong>
          ${order.totalPrice.toLocaleString()}₮
        </strong>
      </div>
    `;

    customerHistoryItems.appendChild(orderCard);
  });
}

closeCustomerHistoryBtn.addEventListener("click", () => {
  customerHistoryModal.classList.remove("show");
});

customerHistoryModal.addEventListener("click", (event) => {
  if (event.target === customerHistoryModal) {
    customerHistoryModal.classList.remove("show");
  }
});

document.addEventListener("click", async (event) => {
  const historyButton = event.target.closest("#customer-history-btn");

  if (!historyButton) return;

  console.log("HISTORY BUTTON CLICKED");

  const modal = document.getElementById("customer-history-modal");

  if (!modal) {
    console.log("History modal oldsongui");
    return;
  }

  modal.classList.add("show");

  await loadCustomerHistory();
});

getFoods();
