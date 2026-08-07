async function loadOrders() {
    const container = document.getElementById("orders-container");
    const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;

    if (!user) {
        container.innerHTML = `
            <div class="empty-state">
                Sign in to see your order history.
                <div style="margin-top:16px;">
                    <button class="btn-brass" onclick="openAuth('login')">Sign In</button>
                </div>
            </div>
        `;
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/orders/user/${user.id}`);
        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }
        const orders = await response.json();

        if (orders.length === 0) {
            container.innerHTML = `<div class="empty-state">No orders yet. <a href="index.html" style="color:var(--brass-deep);font-weight:600;">Start shopping &rarr;</a></div>`;
            return;
        }

        container.innerHTML = orders
            .slice()
            .reverse()
            .map((order) => renderOrder(order))
            .join("");
    } catch (error) {
        console.log("Error loading orders:", error);
        container.innerHTML = `<div class="load-error">Could not load your orders. Please make sure the server is running.</div>`;
    }
}

function renderOrder(order) {
    const date = order.orderDate ? new Date(order.orderDate).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    const items = (order.orderItems || [])
        .map(item => `
            <div class="order-line">
                <span>${item.productName} <span class="mono" style="color:var(--text-soft);">&times;${item.quantity}</span></span>
                <strong>₹${(item.productPrice * item.quantity).toFixed(2)}</strong>
            </div>
        `).join("");

    return `
        <div class="order-card">
            <div class="order-head">
                <span class="order-id">ORDER #${order.id} &middot; ${date}</span>
                <span class="order-status">${order.status}</span>
            </div>
            ${items}
            <div class="order-total">Total: ₹${order.totalAmount.toFixed(2)}</div>
        </div>
    `;
}

document.addEventListener("DOMContentLoaded", loadOrders);
