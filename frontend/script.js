const searchButton = document.getElementById("search-btn");
const foodList = document.getElementById("food-list");
const searchInput = document.getElementById("search-input");
const categoryButtons = document.querySelectorAll(".category-btn");
const foodSearch = document.getElementById("food-search");
const categoryFilter = document.getElementById("category-filter");
const categoryList = document.getElementById("category-list");
const API_URL = "https://qr-menu-nd8d.onrender.com/foods";
let selectedCategory = "";
let editingFoodId = null;

searchInput.addEventListener("input", () => {
  getFoods();
});

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    getFoods();
  }
});

searchButton.addEventListener("click", () => {
  getFoods();
});

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

    getFoods();
  });
});

async function getFoods() {
  try {
    const search = searchInput.value.trim();
    // const category = categoryFilter.value();
    const params = new URLSearchParams();
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
    renderCategories(data.categories);
    renderFoods(data.foods);
  } catch (error) {
    console.log("Error", error);
  }
}

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
    <strong>${food.price.toLocaleString()}₮</strong>`;

    card.addEventListener("click", () => {
      showFoodDetail(food);
    });
    foodList.appendChild(card);
  });
}

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
