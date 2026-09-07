// North & Vine — Order History Renderer

async function loadOrders() {
    const container = document.getElementById("orders-container");
    if (!container) return;

    const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;

    if (!user) {
        container.innerHTML = `
            <div class="empty-state">
                Please sign in to view your order history.
                <div style="margin-top:16px;">
                    <button class="btn-gold" onclick="openAuth('login')">Sign In</button>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = `<div class="empty-state"><i class="fas fa-spinner fa-spin"></i> Loading your order history...</div>`;

    try {
        const response = await fetch(`${BASE_URL}/orders/user/${user.id}`);
        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }
        const orders = await response.json();

        if (!orders || orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    You haven't placed any orders yet. 
                    <div style="margin-top:16px;">
                        <a href="index.html" class="btn-gold">Explore Store</a>
                    </div>
                </div>`;
            return;
        }

        container.innerHTML = orders
            .slice()
            .reverse()
            .map((order) => renderOrder(order))
            .join("");
    } catch (error) {
        console.error("Error loading orders:", error);
        container.innerHTML = `<div class="load-error">Could not load order history. Please check that North & Vine server is active.</div>`;
    }
}

function renderOrder(order) {
    const date = order.orderDate ? new Date(order.orderDate).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }) : "";
    
    let paymentBadgeClass = "pending";
    if (order.paymentStatus === "PAID") paymentBadgeClass = "paid";
    else if (order.paymentStatus === "FAILED") paymentBadgeClass = "failed";

    const items = (order.orderItems || [])
        .map(item => `
            <div class="order-line" style="display:flex; align-items:center; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--paper-line);">
                <div style="display:flex; align-items:center; gap:12px;">
                    <img src="${item.productImageUrl || 'img/img1.png'}" alt="${escapeHtml(item.productName)}" style="width:42px; height:42px; object-fit:cover; border-radius:var(--radius); border:1px solid var(--paper-line);" onerror="this.src='img/img1.png'">
                    <div>
                        <a href="product-detail.html?id=${item.productId}" style="font-weight:500; color:var(--text);">${escapeHtml(item.productName)}</a>
                        <div class="mono" style="font-size:0.75rem; color:var(--text-soft);">Qty: ${item.quantity}</div>
                    </div>
                </div>
                <strong class="mono">${formatCurrency(item.productPrice * item.quantity)}</strong>
            </div>
        `).join("");

    return `
        <div class="order-card">
            <div class="order-head">
                <div>
                    <span class="order-id">ORDER #${order.id}</span>
                    <span style="margin-left: 10px; font-size:0.82rem; color:var(--text-soft);">${date}</span>
                </div>
                <div>
                    <span class="status-badge ${paymentBadgeClass}" style="margin-right: 8px;">Payment: ${order.paymentStatus || 'PENDING'}</span>
                    <span class="status-badge ${order.status === 'CONFIRMED' ? 'paid' : 'pending'}">${order.status || 'PENDING'}</span>
                </div>
            </div>
            <div class="order-items-list" style="margin: 12px 0;">
                ${items}
            </div>
            ${order.shippingAddress ? `<div style="font-size:0.8rem; color:var(--text-soft); margin-top:8px;"><strong>Shipping to:</strong> ${escapeHtml(order.shippingName || '')}, ${escapeHtml(order.shippingAddress)}</div>` : ''}
            <div class="order-total" style="display:flex; justify-content:space-between; align-items:center; margin-top:14px; padding-top:10px; border-top:1px solid var(--paper-line);">
                <span style="font-size:0.85rem; color:var(--text-soft);">Total Amount</span>
                <span class="mono" style="font-size:1.2rem; font-weight:700; color:var(--gold-light);">${formatCurrency(order.totalAmount)}</span>
            </div>
        </div>
    `;
}

document.addEventListener("DOMContentLoaded", loadOrders);
