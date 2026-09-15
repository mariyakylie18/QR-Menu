const BACKEND_URL = "https://qr-menu-nd8d.onrender.com";
const kitchenOrders = document.getElementById("kitchen-orders");
const token = localStorage.getItem("token");
const socket = io(BACKEND_URL, {
  auth: {
    token,
  },
});
socket.on("connect", () => {
  socket.emit("join-admin");
});
socket.on("new-order", () => {
  getOrders();
});

async function getOrders() {
  try {
    const response = await fetch(`${BACKEND_URL}/orders`, {
      headers: {
        Authorization: `Baerer ${token}`,
      },
    });
    const data = await response.json();
    renderOrders(data.orders);
  } catch (error) {
    console.log("Kitchen orders error:", error);
  }
}
getOrders();
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
    const itemsHtml = order.items
      .map((item) => {
        return `<p>${item.quantity} x ${item.name}</p>`;
      })
      .join("");

    const time = new Date(order.createdAt).toLocaleTimeString("mn-MN", {
      hour: "2-digit",
      minute: "2-digit",
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
   <div class= "order-header">
   <div>
   <span class="table-label">TABLE</span>
   <h2>${order.tableNumber}</h2>
   </div>
   <div class="order-time">
   <span>${time}</span>
   <span class="waiting-time ${waitingClass}">
   ${waitingMinutes} min waiting
   </span>
   </div>
   </div>

    <div class="order-items> ${itemsHtml}</div>
    <p class="status ${order.status}"> 
    ${order.status.toUpperCase()}
    </p>
    <button class = "status-btn">
    ${
      order.status === "pending"
        ? "Confirm"
        : order.status === "confirmed"
          ? "Start Preparing"
          : order.status === "preparing"
            ? "Ready"
            : order.status === "ready"
              ? "Complete"
              : "Completed"
    }
    </button>
    `;
    const statusBtn = orderCard.querySelector(".status-btn");
    statusBtn.addEventListener("click", () => {
      let nextStatus;
      if (order.status === "pending") {
        nextStatus = "confirmed";
      } else if (order.status === "confirmed") {
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
