// North & Vine — Cart Utilities (localStorage backed)
const CART_STORAGE_KEY = "cart";

function getCart() {
    try {
        return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
    } catch (e) {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function loadCart() {
    let cartItems = document.getElementById("cart-items");
    if (!cartItems) return;

    let cart = getCart();
    let totalAmount = 0;
    cartItems.innerHTML = "";

    if (cart.length === 0) {
        cartItems.innerHTML = `<tr><td colspan="6" class="text-center" style="padding:48px 16px;color:var(--text-soft);">Your shopping bag is empty. <a href="index.html" style="color:var(--gold-deep);font-weight:600;">Continue browsing &rarr;</a></td></tr>`;
    }

    cart.forEach((item, index) => {
        let itemTotal = item.price * item.quantity;
        totalAmount += itemTotal;

        cartItems.innerHTML += `
            <tr>
                <td><img class="cart-thumb" src="${item.imageUrl || 'img/img1.png'}" alt="${escapeHtml(item.name)}" onerror="this.src='img/img1.png'"></td>
                <td style="font-weight: 500;">
                    <a href="product-detail.html?id=${item.id}" style="color:var(--text);">${escapeHtml(item.name)}</a>
                </td>
                <td class="mono">${formatCurrency(item.price)}</td>
                <td>
                    <div class="qty-control">
                        <button onclick="changeQuantity(${index},-1)" aria-label="Decrease quantity">&minus;</button>
                        <span>${item.quantity}</span>
                        <button onclick="changeQuantity(${index},1)" aria-label="Increase quantity">+</button>
                    </div>
                </td>
                <td class="mono" style="font-weight:600; color:var(--gold-light);">${formatCurrency(itemTotal)}</td>
                <td><button class="remove-btn" onclick="removeItem(${index})" aria-label="Remove item">&times;</button></td>
            </tr>
        `;
    });

    let totalEl = document.getElementById("total-amount");
    if (totalEl) totalEl.innerText = formatCurrency(totalAmount);
    let totalEl2 = document.getElementById("total-amount-2");
    if (totalEl2) totalEl2.innerText = formatCurrency(totalAmount);

    let itemCountEl = document.getElementById("item-count");
    if (itemCountEl) itemCountEl.innerText = cart.reduce((sum, item) => sum + item.quantity, 0);
}

function addToCart(id, name, price, imageUrl, qtyToAdd = 1) {
    price = parseFloat(price);
    let cart = getCart();
    let itemIndex = cart.findIndex((item) => item.id === id);

    if (itemIndex !== -1) {
        cart[itemIndex].quantity += qtyToAdd;
    } else {
        cart.push({
            id: id,
            name: name,
            price: price,
            imageUrl: imageUrl,
            quantity: qtyToAdd
        });
    }

    saveCart(cart);
    updateCartCounter();
    if (typeof showToast === "function") showToast(`Added "${name}" to shopping bag.`, "success");
}

function buyNow(id, name, price, imageUrl, qtyToAdd = 1) {
    addToCart(id, name, price, imageUrl, qtyToAdd);
    window.location.href = "checkout.html";
}

function updateCartCounter() {
    let badges = document.querySelectorAll(".cart-badge");
    if (!badges || badges.length === 0) return;
    let cart = getCart();
    let totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    badges.forEach(badge => badge.innerText = totalQty);
}

function changeQuantity(index, change) {
    let cart = getCart();
    if (!cart[index]) return;
    cart[index].quantity += change;
    if (cart[index].quantity <= 0) cart.splice(index, 1);
    saveCart(cart);
    loadCart();
    updateCartCounter();
}

function removeItem(index) {
    let cart = getCart();
    if (cart[index]) {
        const name = cart[index].name;
        cart.splice(index, 1);
        saveCart(cart);
        loadCart();
        updateCartCounter();
        if (typeof showToast === "function") showToast(`Removed "${name}" from bag.`, "info");
    }
}

function proceedToCheckout() {
    let cart = getCart();
    if (cart.length === 0) {
        if (typeof showToast === "function") showToast("Your shopping bag is empty.", "error");
        return;
    }

    const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;
    if (!user) {
        if (typeof showToast === "function") showToast("Please sign in to proceed to checkout.", "info");
        if (typeof openAuth === "function") openAuth("login");
        return;
    }

    window.location.href = "checkout.html";
}

document.addEventListener("DOMContentLoaded", () => {
    loadCart();
    updateCartCounter();
});
