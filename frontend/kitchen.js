const kitchenOrders = document.getElementById("kitchen-orders");
const BACKEND_URL = "https://qr-menu-nd8d.onrender.com";
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
if (!token || (role !== "admin" && role !== "kitchen")) {
  window.location.href = "login.html";
}

let newOrderId = null;
const socket = io(BACKEND_URL, {
  auth: {
    token,
  },
});
const newOrderSound = new Audio("./sounds/bell.mp3");
const newOrderAlert = document.getElementById("new-order-alert");
let newOrderAlertTimer;
const kitchenLogoutBtn = document.getElementById("kitchen-logout-btn");
kitchenLogoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("user");

  window.location.href = "login.html";
});
socket.on("connect", () => {
  socket.emit("join-admin");
});

socket.on("new-order", async () => {
  newOrderSound.currentTime = 0;

  newOrderSound.play().catch((error) => {
    console.log("Sound play blocked:", error);
  });
  await getOrders();

  if (newOrderAlert) {
    newOrderAlert.classList.add("show");

    clearTimeout(newOrderAlertTimer);

    newOrderAlertTimer = setTimeout(() => {
      newOrderAlert.classList.remove("show");
    }, 10000);
  }
});

async function getOrders() {
  try {
    const response = await fetch(`${BACKEND_URL}/orders`, {
      headers: {
        Authorization: `Baerer ${token}`,
      },
    });
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user");
      window.location.href = "login.html";
      return;
    }
    const data = await response.json();
    renderOrders(data.orders);
  } catch (error) {
    console.log("Kitchen orders error:", error);
  }
}
getOrders();

const statusText = {
  pending: " Хүлээгдэж байна",
  preparing: "Бэлтгэж байна",
  ready: "Бэлэн",
  completed: "Дууссан",
};

function renderOrders(orders) {
  kitchenOrders.innerHTML = "";
  const activeOrders = orders.filter((order) => {
    return order.status !== "completed";
  });
  activeOrders.sort((a, b) => {
    return new Date(a.createdAt) - new Date(b.createdAt);
  });
  activeOrders.forEach((order) => {
    const orderCard = document.createElement("div");
    orderCard.classList.add("order-card");
    if (order._id === newOrderId) {
      orderCard.classList.add("new-order");
    }
    const foodItems = order.items.filter((item) => item.type === "food");
    if (foodItems.length === 0) {
      return;
    }
    const itemsHtml = foodItems
      .map((item) => {
        const quantity = item.quantity ?? 1;
        return `
      <div class="kitchen-item">
      <span class="kitchen-item-name">
      ${item.name}
      </span>
      <span class="kitchen-item-quantity"> x ${quantity} </span>
      </div>
      `;
      })
      .join("");

    const time = new Date(order.createdAt).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const waitingMinutes = Math.floor(
      (Date.now() - new Date(order.createdAt).getTime()) / 60000,
    );
    let waitingClass = "";
    if (waitingMinutes >= 20) {
      waitingClass = "very-late";
    } else if (waitingMinutes >= 10) {
      waitingClass = "late";
    }

    orderCard.innerHTML = `
    ${
      order._id === newOrderId
        ? `<span class= "new-order-badge">Шинэ захиалга</span>`
        : ""
    }
     <div class= "order-header">
     <div class="table-info">
      <span class="table-label">Ширээ</span>
      <h2>${order.tableNumber}</h2>
     </div>
    
     <div class="order-time">
      <span class="order-clock">${time}</span>
      <span class="waiting-time ${waitingClass}">
      ${waitingMinutes} мин хүлээгдэж байнав
       </span>
     </div>
     <div>
      <div class="order-items"> ${itemsHtml}</div>
     <button class="status-btn status-${order.status}">${statusText[order.status]}</button>
      `;

    const statusBtn = orderCard.querySelector(".status-btn");
    statusBtn.addEventListener("click", () => {
      let nextStatus;
      if (order.status === "pending") {
        nextStatus = "preparing";
      } else if (order.status === "preparing") {
        nextStatus = "ready";
      } else if (order.status === "ready") {
        nextStatus = "completed";
      } else {
        return;
      }
      updateOrderStatus(order._id, nextStatus);
    });
    kitchenOrders.appendChild(orderCard);
  });
}

async function updateOrderStatus(orderId, status) {
  try {
    const response = await fetch(`${BACKEND_URL}/orders/${orderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        status: status,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      console.log("Status update error:", data);
      return;
    }
    getOrders();
  } catch (error) {
    console.log("Status update error:", error);
  }
}
