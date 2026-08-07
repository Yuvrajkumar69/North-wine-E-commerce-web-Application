// Shared cart utilities - cart is always read fresh from localStorage to avoid stale state
const CART_STORAGE_KEY = "cart";

function getCart() {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
}

function saveCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function loadCart() {
    let cartItems = document.getElementById("cart-items");
    if (!cartItems) return; // not on the cart page (e.g. index.html also loads this script)

    let cart = getCart();
    let totalAmount = 0;
    cartItems.innerHTML = "";

    if (cart.length === 0) {
        cartItems.innerHTML = `<tr><td colspan="5" class="text-center" style="padding:36px 16px;color:var(--text-soft);">Your cart is empty. <a href="index.html" style="color:var(--brass-deep);font-weight:600;">Continue shopping &rarr;</a></td></tr>`;
    }

    cart.forEach((item, index) => {
        let itemTotal = item.price * item.quantity;
        totalAmount += itemTotal;

        cartItems.innerHTML += `
            <tr>
                <td><img class="cart-thumb" src="${item.imageUrl}" alt="${item.name}"></td>
                <td>${item.name}</td>
                <td class="mono">₹${item.price}</td>
                <td>
                    <div class="qty-control">
                        <button onclick="changeQuantity(${index},-1)" aria-label="Decrease quantity">&minus;</button>
                        <span>${item.quantity}</span>
                        <button onclick="changeQuantity(${index},1)" aria-label="Increase quantity">+</button>
                    </div>
                </td>
                <td class="mono" style="font-weight:600;">₹${itemTotal}</td>
                <td><button class="remove-btn" onclick="removeItem(${index})" aria-label="Remove item">&times;</button></td>
            </tr>
        `;
    });

    let totalEl = document.getElementById("total-amount");
    if (totalEl) totalEl.innerText = totalAmount;
    let totalEl2 = document.getElementById("total-amount-2");
    if (totalEl2) totalEl2.innerText = totalAmount;

    let itemCountEl = document.getElementById("item-count");
    if (itemCountEl) itemCountEl.innerText = cart.reduce((sum, item) => sum + item.quantity, 0);
}

function addToCart(id,name,price,imageUrl)
{
    price=parseFloat(price);
    let cart = getCart();
    let itemIndex=cart.findIndex((item) => item.id===id)
    if(itemIndex!==-1)
    {
        cart[itemIndex].quantity+=1;
    }
    else{
        cart.push({
            id:id,
            name: name,
            price: price,
            imageUrl:imageUrl,
            quantity:1
        });
    }
    saveCart(cart);
    updateCartCounter();
    if (typeof showToast === "function") showToast(`Added "${name}" to cart.`);
}


function updateCartCounter()
{
    let badge = document.querySelector(".cart-badge");
    if (!badge) return; // not on a page that has the navbar cart icon
    let cart = getCart();
    badge.innerText = cart.reduce((sum, item) => sum + item.quantity, 0);
}


function changeQuantity(index,change)
{
    let cart = getCart();
    if (!cart[index]) return;
    cart[index].quantity+=change;
    if(cart[index].quantity<=0) cart.splice(index,1);
    saveCart(cart);
    loadCart();
    updateCartCounter();
}

function removeItem(index)
{
    let cart = getCart();
    cart.splice(index,1);
    saveCart(cart);
    loadCart();
    updateCartCounter();
    if (typeof showToast === "function") showToast("Item removed from cart.");
}

async function checkout()
{
    let cart = getCart();
    if (cart.length === 0) {
        showToast("Your cart is empty.", "error");
        return;
    }

    const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;
    if (!user) {
        showToast("Please sign in to check out.", "error");
        if (typeof openAuth === "function") openAuth("login");
        return;
    }

    let productQuantities = {};
    let totalAmount = 0;
    cart.forEach((item) => {
        productQuantities[item.id] = item.quantity;
        totalAmount += item.price * item.quantity;
    });

    try {
        const response = await fetch(`${BASE_URL}/orders/place/${user.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productQuantities, totalAmount })
        });

        const payload = await response.json();

        if (!response.ok) {
            throw new Error(payload.message || `Order failed with status ${response.status}`);
        }

        showToast(`Order #${payload.id} placed successfully!`);
        localStorage.removeItem(CART_STORAGE_KEY);
        loadCart();
        updateCartCounter();
        setTimeout(() => { window.location.href = "orders.html"; }, 900);
    } catch (error) {
        console.log("Error placing order:", error);
        showToast(error.message || "Could not place your order.", "error");
    }
}


document.addEventListener("DOMContentLoaded", () => {
    loadCart();
    updateCartCounter();
});
