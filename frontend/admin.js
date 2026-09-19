const API_URL = "https://qr-menu-nd8d.onrender.com/foods";
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
if (!token || role !== "admin") {
  window.location.href = "login.html";
}
const BACKEND_URL = "https://qr-menu-nd8d.onrender.com";
const socket = io(BACKEND_URL, {
  auth: { token },
});
socket.on("connect", () => {
  socket.emit("join-admin");
});
const kitchenReadySound = new Audio("./sounds/ready.mp3");
const imageInput = document.getElementById("food-image");
const imageBtn = document.getElementById("image-btn");
const imageText = document.getElementById("image-text");

const foodModal = document.getElementById("food-modal");
const openAddFoodBtn = document.getElementById("open-add-food-btn");
const closeModalBtn = document.getElementById("close-modal-btn");
const formTitle = document.getElementById("form-title");
const toast = document.getElementById("toast");
const deleteModal = document.getElementById("delete-modal");
const cancelDeleteBtn = document.getElementById("cancel-delete-btn");
const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
const prevPageBtn = document.getElementById("prev-page-btn");
const nextPageBtn = document.getElementById("next-page-btn");
const pageInfo = document.getElementById("page-info");
const totalFoodsEl = document.getElementById("total-foods");
const totalCategoriesEl = document.getElementById("total-categories");
const clearFilterBtn = document.getElementById("clear-filter-btn");
const sortFilter = document.getElementById("sort-filter");
const ordersList = document.getElementById("orders-list");
const orderNotification = document.getElementById("order-notification");
const orderSound = document.getElementById("order-sound");
const orderHistory = document.getElementById("order-history");
const historyBtn = document.getElementById("history-btn");
const foodType = document.getElementById("food-type");
const foodCategory = document.getElementById("food-category");
const adminTypeBtn = document.querySelectorAll(".admin-type-btn");
const billSound = new Audio("./sounds/bill.mp3");
let selectedAdminType = "";
// foodType.addEventListener("change", () => {
function updateCategories() {
  console.log("UPDATE:", foodType.value);
  if (foodType.value === "food") {
    foodCategory.innerHTML = `
  <option value ="">Category сонгох</option>
  <option value ="1-р хоол">1-р хоол</option>
  <option value ="2-р хоол">2-р хоол</option>
  <option value ="Захиалгат хоол">Захиалгат хоол</option>
  <option value ="Тахиан махтай хоол">Тахиан махтай хоол</option>
  <option value ="Солонгос хоол">Солонгос хоол</option>
  <option value ="Багцын хоол">Багцын хоол</option>
  <option value ="Пицца">Пицца</option>
  <option value ="Хачир, салат">Хачир, салат</option>
  `;
  } else if (foodType.value === "drink") {
    foodCategory.innerHTML = `
     <option value ="">Category сонгох</option>
     <option value ="Хүйтэн уух зүйлс">Хүйтэн уух зүйлс</option>
     <option value ="Халуун уух зүйлс">Халуун уух зүйлс</option>
     <option value ="Архи">Архи</option>
     <option value ="Пиво">Пиво</option>
     <option value ="Виски">Виски</option>
     <option value ="Ликор">Ликор</option>
     <option value ="Жинь Текила">Жинь Текила</option>
     <option value ="Дарс">Дарс</option>
     <option value ="Коньяк">Коньяк</option>
     <option value ="Коктейл">Коктейл</option>
     <option value ="Амттан">Амттан</option>
    `;
  }
}

foodType.addEventListener("change", updateCategories);
let currentPage = 1;
let totalPages = 1;

let deletingFoodId = null;

imageBtn.addEventListener("click", () => {
  imageInput.click();
});

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];

  if (!file) {
    return;
  }
  imageText.textContent = file.name;
  const preview = document.getElementById("current-image-preview");

  preview.src = URL.createObjectURL(file);
  preview.style.display = "block";
});

if (!token || token === "undefined") {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

const logoutBtn = document.getElementById("logout-btn");
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  window.location.href = "login.html";
});

let editingFoodId = null;
const foodList = document.getElementById("food-list");
const addFoodForm = document.getElementById("add-food-form");
const submitButton = document.getElementById("submit-food-btn");
const searchInput = document.getElementById("food-search");
const searchBtn = document.getElementById("search-btn");
const categoryFilter = document.getElementById("category-filter");
// const submitButton = addFoodForm.querySelector('button[type="submit"]');

openAddFoodBtn.addEventListener("click", () => {
  editingFoodId = null;
  addFoodForm.reset();
  updateCategories();
  submitButton.textContent = "Шинээр нэмэх";
  formTitle.textContent = "Шинээр нэмэх";
  imageBtn.textContent = "Зураг сонгох";
  imageText.textContent = "Зураг сонгогдоогүй";
  foodModal.classList.add("show");
});
closeModalBtn.addEventListener("click", () => {
  foodModal.classList.remove("show");
});

function showToast(message, type = "success", duration = 4000) {
  toast.textContent = message;

  toast.className = `toast ${type} show`;
  setTimeout(() => {
    toast.classList.remove("show");
  }, duration);
}
async function getFoods() {
  try {
    foodList.innerHTML = `<div class="loading-state">
    <p>Loading foods...</p>
  </div>`;
    const search = searchInput.value.trim();
    const category = categoryFilter.value;
    const params = new URLSearchParams();
    if (selectedAdminType) {
      params.set("type", selectedAdminType);
    }
    const sort = sortFilter.value;
    if (sort) {
      params.set("sort", sort);
    }
    params.set("page", currentPage);
    params.set("limit", 6);

    if (search) {
      params.set("search", search);
    }
    if (category) {
      params.set("category", category);
    }

    const response = await fetch(`${API_URL}?${params}`);
    if (!response.ok) {
      throw new Error("Foods авч чадсангүй");
    }
    const data = await response.json();
    renderCategories(data.categories);

    totalFoodsEl.textContent = data.totalFoods;
    totalCategoriesEl.textContent = data.totalCategories;
    if (data.foods.length === 0 && currentPage > 1) {
      currentPage--;
      getFoods();
      return;
    }

    if (currentPage > data.totalPages && data.totalPages > 0) {
      currentPage = data.totalPages;
      getFoods();
      return;
    }
    renderFoods(data.foods);
    totalPages = data.totalPages;
    pageInfo.textContent = `Page ${data.page} / ${totalPages}`;
    prevPageBtn.disabled = data.page <= 1;
    nextPageBtn.disabled = data.page >= totalPages;
  } catch (error) {
    console.log("Get foods error:", error);
    foodList.innerHTML = `<div class="error-state">
    <h3>Something went wrong</h3>
    <p>Foods could not be loaded</p>
    <button id="retry-btn" type= "button">Try again</button>
    </div>`;
    const retryBtn = document.getElementById("retry-btn");
    retryBtn.addEventListener("click", () => {
      getFoods();
    });
  }
}
adminTypeBtn.forEach((button) => {
  button.addEventListener("click", () => {
    adminTypeBtn.forEach((btn) => {
      btn.classList.remove("active");
    });

    button.classList.add("active");

    selectedAdminType = button.dataset.type;

    currentPage = 1;
    getFoods();
  });
});

prevPageBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    getFoods();
  }
});
nextPageBtn.addEventListener("click", () => {
  if (currentPage < totalPages) {
    currentPage++;
    getFoods();
  }
});

searchBtn.addEventListener("click", () => {
  currentPage = 1;
  getFoods();
});
searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    currentPage = 1;
    getFoods();
  }
});
categoryFilter.addEventListener("change", () => {
  currentPage = 1;
  getFoods();
});
sortFilter.addEventListener("change", () => {
  currentPage = 1;
  getFoods();
});

clearFilterBtn.addEventListener("click", () => {
  searchInput.value = "";
  categoryFilter.value = "";
  sortFilter.value = "";
  currentPage = 1;
  getFoods();
});

function getImageUrl(image) {
  if (!image) {
    return " ";
  }
  if (image.startsWith("/uploads/")) {
    return `https://qr-menu-nd8d.onrender.com${image}`;
  }
  if (image.startsWith("images/")) {
    return image;
  }
  return image;
}

function renderFoods(foods) {
  const totalFoods = document.getElementById("total-foods");
  const totalCategories = document.getElementById("total-categories");
  totalFoods.textContent = foods.length;
  const categories = new Set(foods.map((food) => food.category));
  totalCategories.textContent = categories.size;

  foodList.innerHTML = "";

  if (foods.length === 0) {
    foodList.innerHTML = `
    <div class="empty-state">
      <h3>No foods found.</h3>
      <p>Try anothersearch or category.</p>
    </div>
    `;
    return;
  }
  foods.forEach((food) => {
    const card = document.createElement("div");
    foodType.value = food.type;
    updateCategories();
    foodCategory.value = food.category;
    card.classList.add("food-card");

    card.innerHTML = `
                ${food.image ? `<img class="food-image" src="${getImageUrl(food.image)}" alt="${food.name}">` : ""}
                <h3>${food.name}</h3>
                <p>${food.description || ""}</p>
                <strong>${Number(food.price).toLocaleString()}₮</strong>
    <div class="admin-actions">
      <button class="edit-btn">Засах</button>
      <button class="delete-btn">Устгах</button>
      <button class="availability-btn ${
        food.isAvailable !== false ? "available" : "unavailable"
      }"
        >
        ${food.isAvailable !== false ? "Гарч  байгаа" : "Түр гарахгүй"} 
        </button>
    </div>`;

    const editButton = card.querySelector(".edit-btn");
    const deleteButton = card.querySelector(".delete-btn");
    const availabilityBtn = card.querySelector(".availability-btn");

    editButton.addEventListener("click", () => {
      startEditingFood(food);
    });
    deleteButton.addEventListener("click", () => {
      deleteFood(food._id);
    });

    availabilityBtn.addEventListener("click", async () => {
      try {
        const newAvailability = food.isAvailable === false;

        const response = await fetch(`${API_URL}/${food._id}/availability`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            isAvailable: newAvailability,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.log("Availability error:", data);
          return;
        }

        getFoods();
      } catch (error) {
        console.log("Availability error:", error);
      }
    });

    foodList.appendChild(card);
  });
}

function renderCategories(categories) {
  const selectedCategory = categoryFilter.value;
  categoryFilter.innerHTML = `<option value="">Бүх категори</option>`;
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
  categoryFilter.value = selectedCategory;
}

function startEditingFood(food) {
  const preview = document.getElementById("current-image-preview");
  const imageNote = document.getElementById("image-note");

  if (food.image) {
    preview.src = getImageUrl(food.image);
    preview.style.display = "block";
    imageNote.textContent =
      "Хэрвээ та зураг солихгүй бол одоо байгаа зургаар хадгалагдана.";
  }

  editingFoodId = food._id;

  document.getElementById("food-name").value = food.name;
  document.getElementById("food-price").value = food.price;
  document.getElementById("food-category").value = food.category;
  document.getElementById("food-description").value = food.description || "";

  submitButton.textContent = "Хадгалах";

  // window.scrollTo({
  //   top: 0,
  //   behavior: "smooth",
  // });

  imageBtn.textContent = "Зураг солих";
  imageText.textContent = "Сонгогдсон зураг";
  foodModal.classList.add("show");
}
function deleteFood(id) {
  deletingFoodId = id;
  deleteModal.classList.add("show");
  cancelDeleteBtn.addEventListener("click", () => {
    deletingFoodId = null;
    deleteModal.classList.remove("show");
  });

  confirmDeleteBtn.addEventListener("click", async () => {
    if (!deletingFoodId) {
      return;
    }
    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.textContent = "Deleting ...";
    try {
      const response = await fetch(`${API_URL}/${deletingFoodId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Baerer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to delete food");
      }
      showToast("Food deleted successfully");
      deleteModal.classList.remove("show");
      deletingFoodId = null;
      getFoods();
    } catch (error) {
      console.log("Delete food error:", error);
      showToast(error.message, "error");
    } finally {
      confirmDeleteBtn.disabled = false;
      confirmDeleteBtn.textContent = "Delete";
    }
  });
}

addFoodForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = document.getElementById("food-name").value.trim();
  const price = document.getElementById("food-price").value;
  const category = document.getElementById("food-category").value.trim();
  const description = document.getElementById("food-description").value.trim();
  if (!editingFoodId && !imageInput.files[0]) {
    alert("Please choose photo for add new food");
    return;
  }
  if (name.length < 2) {
    alert("Food name must be at least 2 characters.");
    return;
  }
  if (Number(price) <= 0) {
    alert("Price must be greater than 0.");
    return;
  }
  if (!category) {
    alert("Please select a category.");
    retunr;
  }
  const image = imageInput.files[0];
  if (image) {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(image.type)) {
      alert("Please choose a JPG, PNG, or WEBP image.");
      return;
    }
    const maxSize = 5 * 1024 * 1024;
    if (image.size > maxSize) {
      alert("Image must be smaller than 5MB.");
      return;
    }
  }

  const formData = new FormData();
  formData.append("type", foodType.value);
  formData.append("name", name);
  formData.append("price", price);
  formData.append("category", category);
  formData.append("description", description);
  if (image) {
    formData.append("image", image);
  }

  const url = editingFoodId ? `${API_URL}/${editingFoodId}` : API_URL;
  const method = editingFoodId ? "PATCH" : "POST";
  try {
    submitButton.disabled = true;
    submitButton.textContent = editingFoodId ? "Saving..." : "Adding...";
    console.log("editingFoodId:", editingFoodId);
    console.log("method:", method);
    console.log("url", url);
    const response = await fetch(url, {
      method: method,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Food нэмэхэд алдаа гарлаа");
    }

    const createdFood = await response.json();

    editingFoodId = null;

    addFoodForm.reset();

    submitButton.textContent = "Add Food";
    formTitle.textContent = "Add Food";
    imageBtn.textContent = "Choose image";
    imageText.textContent = "No image selected";
    const preview = document.getElelemtById("current-image-preview");
    const imageNote = document.getElementById("image-note");
    preview.src = "";
    preview.style.display = "none";
    imageNote.textContent = "";
  } catch (error) {
    console.log("Add food error", error);
    showToast(error.message, "error");
  } finally {
    submitButton.disabled = false;

    if (foodModal.classList.contains("show")) {
      submitButton.textContent = editingFoodId ? "Save Changes" : "Add Food";
    }
  }
  showToast(
    method === "PATCH"
      ? "Food updated successfully"
      : "Food added successfully",
  );
  foodModal.classList.remove("show");
  showToast;
  getFoods();
});

async function getOrders() {
  ordersList.innerHTML = "";
  orderHistory.innerHTML = "";
  const token = localStorage.getItem("token");
  const response = await fetch(`${BACKEND_URL}/orders`, {
    headers: {
      Authorization: `Baerer ${token}`,
    },
  });
  const data = await response.json();
  data.orders.forEach((order) => {
    console.log(order);

    const itemsHtml = order.items
      .map((item) => {
        return `<p>${item.name} x ${item.quantity}</p>`;
      })
      .join("");
    const orderTime = new Date(order.createdAt).toLocaleTimeString();
    const orderDate = new Date(order.createdAt).toLocaleDateString();
    const orderCard = document.createElement("div");
    orderCard.classList.add("order-card");
    if (order.status === "pending") {
      orderCard.classList.add("new-order");
    } else {
      orderCard.classList.remove("new-order");
    }
    orderCard.innerHTML = `
    <h3>Ширээ ${order.tableNumber}</h3>
    <p>Захиалгын огноо: ${orderDate}, ${orderTime}</p>
    <div class="order-detail">
    ${itemsHtml}
    <p>Total: ${order.totalPrice.toLocaleString()}₮</p>
    </div>
    <select class= "order-status status-${order.status}">
    <option value="pending" ${order.status === "pending" ? "selected" : ""}>Шинэ захиалга</option>
    <option value="confirmed" ${order.status === "confirmed" ? "selected" : ""}>Захиалга баталгаажсан</option>
    <option value="preparing" ${order.status === "preparing" ? "selected" : ""}>Бэлтгэж байна</option>
    <option value="ready" ${order.status === "ready" ? "selected" : ""}>Бэлэн болсон</option>
    <option value="completed" ${order.status === "completed" ? "selected" : ""}>Тооцоо дууссан</option>
    </select>
    `;
    const statusSelect = orderCard.querySelector(".order-status");
    statusSelect.classList.add(`status-${order.status}`);
    statusSelect.addEventListener("change", async () => {
      const newStatus = statusSelect.value;
      statusSelect.classList.remove(
        "status-pending",
        "status-confirmed",
        "status-preparing",
        "status-ready",
        "status-completed",
      );
      statusSelect.classList.add(`status-${newStatus}`);
      const response = await fetch(
        `${BACKEND_URL}/orders/${order._id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Baerer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        },
      );
      const data = response.json();
    });

    if (order.status === "completed") {
      orderHistory.appendChild(orderCard);
      orderCard.addEventListener("click", () => {
        orderCard.classList.toggle("show-detail");
      });
    } else {
      ordersList.appendChild(orderCard);
    }
  });
  if (response.ok) {
    console.log("Status updated");
  } else {
    alert(data.message);
  }
}
historyBtn.addEventListener("click", () => {
  orderHistory.classList.toggle("show");
});

socket.on("new-order", () => {
  getOrders();
  orderSound.currentTime = 0;
  orderSound.play().catch((error) => {
    console.log("New order sound blocked:", error);
  });
  showToast(" 🔔 Шинэ захиалга ирлээ", "success");
});

socket.on("order-ready", (data) => {
  console.log("Order ready recieved:", data);
  kitchenReadySound.currentTime = 0;
  kitchenReadySound.play().catch((error) => {
    console.log("Ready sound blocked;", error);
  });
  showToast(`Ширээ ${data.tableNumber}-ийн хоол бэлэн боллоо`, "success");
  getOrders();
});

socket.on("bill-requested", (data) => {
  showToast(
    `💳 Ширээ ${data.tableNumber} тооцоо авах хүсэлт илгээлээ`,
    "success",
    15000,
  );
  billSound.currentTime = 0;
  billSound.play().catch((error) => {
    console.log("Bill sound blocked:", error);
  });
});
document.addEventListener(
  "click",
  async () => {
    const sounds = [orderSound, kitchenReadySound, billSound];
    for (const sound of sounds) {
      try {
        sound.volume = 0;
        await sound.play();
        sound.pause();
        sound.currentTime = 0;
        sound.volume = 1;
      } catch (error) {
        console.log("Audio unlock error:", error);
      }
    }
  },
  { once: true },
);

getOrders();
// setInterval(getOrders, 5000);
getFoods();
