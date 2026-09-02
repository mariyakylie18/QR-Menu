const API_URL = "http://localhost:8000/foods";
const token = localStorage.getItem("token");

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

  submitButton.textContent = "Add Food";
  formTitle.textContent = "Add Food";
  imageBtn.textContent = "Choose image";
  imageText.textContent = "No image selected";
  foodModal.classList.add("show");
});
closeModalBtn.addEventListener("click", () => {
  foodModal.classList.remove("show");
});

function showToast(message, type = "success") {
  toast.textContent = message;

  toast.className = `toast ${type} show`;
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}
async function getFoods() {
  try {
    foodList.innerHTML = `<div class="loading-state">
    <p>Loading foods...</p>
  </div>`;
    const search = searchInput.value.trim();
    const category = categoryFilter.value;
    const params = new URLSearchParams();
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
    return `http://localhost:8000${image}`;
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
    card.classList.add("food-card");

    card.innerHTML = `
                ${food.image ? `<img class="food-image" src="${getImageUrl(food.image)}" alt="${food.name}">` : ""}
                <h3>${food.name}</h3>
                <p>${food.description || ""}</p>
                <strong>${Number(food.price).toLocaleString()}₮</strong>
    <div class="admin-actions">
      <button class="edit-btn">Edit</button>
      <button class="delete-btn">Delete</button>
    </div>`;

    const editButton = card.querySelector(".edit-btn");
    const deleteButton = card.querySelector(".delete-btn");

    editButton.addEventListener("click", () => {
      startEditingFood(food);
    });
    deleteButton.addEventListener("click", () => {
      deleteFood(food._id);
    });
    foodList.appendChild(card);
  });
}

function renderCategories(categories) {
  const selectedCategory = categoryFilter.value;
  categoryFilter.innerHTML = `<option value="">All categories</option>`;
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
      "If you don’t select a new image, the current image will remain unchanged.";
  }

  editingFoodId = food._id;

  document.getElementById("food-name").value = food.name;
  document.getElementById("food-price").value = food.price;
  document.getElementById("food-category").value = food.category;
  document.getElementById("food-description").value = food.description || "";

  submitButton.textContent = "Save Changes";

  // window.scrollTo({
  //   top: 0,
  //   behavior: "smooth",
  // });

  imageBtn.textContent = "Change image";
  imageText.textContent = "Current image will be kept";
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

getFoods();
