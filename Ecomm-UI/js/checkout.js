// North & Vine — Multi-Step Checkout & Razorpay Integration

let isProcessingCheckout = false;

function initCheckoutPage() {
    const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;
    if (!user) {
        showToast("Please sign in to access checkout.", "info");
        setTimeout(() => { window.location.href = "index.html"; }, 1000);
        return;
    }

    const cart = getCart();
    if (cart.length === 0) {
        showToast("Your shopping bag is empty.", "error");
        setTimeout(() => { window.location.href = "cart.html"; }, 1000);
        return;
    }

    prefillCustomerInfo(user);
    renderCheckoutSummary(cart);
}

function prefillCustomerInfo(user) {
    const nameEl = document.getElementById("shippingName");
    const emailEl = document.getElementById("shippingEmail");
    const phoneEl = document.getElementById("shippingPhone");

    if (nameEl && !nameEl.value) nameEl.value = user.name || "";
    if (emailEl && !emailEl.value) emailEl.value = user.email || "";
    if (phoneEl && !phoneEl.value) phoneEl.value = user.phone || "";
}

function renderCheckoutSummary(cart) {
    const summaryItems = document.getElementById("checkout-summary-items");
    const totalEl = document.getElementById("checkout-total-amount");
    if (!summaryItems) return;

    let subtotal = 0;
    summaryItems.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        return `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; font-size:0.9rem;">
                <div>
                    <strong>${escapeHtml(item.name)}</strong>
                    <div style="font-size:0.78rem; color:var(--text-on-ink-soft);">Qty: ${item.quantity} &times; ${formatCurrency(item.price)}</div>
                </div>
                <span class="mono">${formatCurrency(itemTotal)}</span>
            </div>
        `;
    }).join("");

    if (totalEl) totalEl.innerText = formatCurrency(subtotal);
}

async function handleCheckoutSubmit(event) {
    event.preventDefault();
    if (isProcessingCheckout) return;

    const user = getCurrentUser();
    if (!user) {
        showToast("Please sign in to place an order.", "error");
        return;
    }

    const cart = getCart();
    if (cart.length === 0) {
        showToast("Your shopping bag is empty.", "error");
        return;
    }

    const shippingName = document.getElementById("shippingName").value.trim();
    const shippingEmail = document.getElementById("shippingEmail").value.trim();
    const shippingPhone = document.getElementById("shippingPhone").value.trim();
    const addressLine = document.getElementById("shippingAddress").value.trim();
    const city = document.getElementById("shippingCity").value.trim();
    const state = document.getElementById("shippingState").value.trim();
    const pincode = document.getElementById("shippingPincode").value.trim();

    if (!shippingName || !shippingEmail || !shippingPhone || !addressLine || !city || !pincode) {
        showToast("Please fill in all required shipping fields.", "error");
        return;
    }

    const fullAddress = `${addressLine}, ${city}, ${state} ${pincode}`.trim();

    const productQuantities = {};
    cart.forEach(item => {
        productQuantities[item.id] = item.quantity;
    });

    const checkoutRequest = {
        productQuantities: productQuantities,
        shippingName: shippingName,
        shippingEmail: shippingEmail,
        shippingPhone: shippingPhone,
        shippingAddress: fullAddress
    };

    const payBtn = document.getElementById("payNowBtn");
    if (payBtn) {
        payBtn.disabled = true;
        payBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Initializing Payment...`;
    }
    isProcessingCheckout = true;

    try {
        const response = await fetch(`${BASE_URL}/orders/checkout/${user.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(checkoutRequest)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || data.message || "Checkout initialization failed.");
        }

        // Open Razorpay Checkout modal
        openRazorpayModal(data, checkoutRequest);

    } catch (error) {
        console.error("Checkout error:", error);
        showToast(error.message || "Payment could not be initialized. Please try again.", "error");
        if (payBtn) {
            payBtn.disabled = false;
            payBtn.innerHTML = `Proceed to Payment`;
        }
        isProcessingCheckout = false;
    }
}

function openRazorpayModal(razorpayData, checkoutRequest) {
    if (typeof Razorpay === "undefined") {
        showToast("Razorpay SDK failed to load. Please refresh the page.", "error");
        resetPayBtn();
        return;
    }

    const options = {
        key: razorpayData.razorpayKeyId,
        amount: Math.round(Number(razorpayData.amount) * 100), // amount in paise
        currency: razorpayData.currency || "INR",
        name: "North & Vine",
        description: `Order #${razorpayData.orderId}`,
        image: "img/img1.png",
        order_id: razorpayData.razorpayOrderId,
        handler: async function (response) {
            await verifyPaymentOnServer(response, razorpayData.orderId);
        },
        prefill: {
            name: checkoutRequest.shippingName,
            email: checkoutRequest.shippingEmail,
            contact: checkoutRequest.shippingPhone
        },
        theme: {
            color: "#16231C"
        },
        modal: {
            ondismiss: function () {
                showToast("Payment was cancelled.", "info");
                resetPayBtn();
            }
        }
    };

    const rzp = new Razorpay(options);
    rzp.on('payment.failed', function (response) {
        console.error("Razorpay payment failed:", response.error);
        showToast("Payment failed: " + (response.error.description || "Transaction declined."), "error");
        resetPayBtn();
    });
    rzp.open();
}

async function verifyPaymentOnServer(razorpayResponse, orderId) {
    const payBtn = document.getElementById("payNowBtn");
    if (payBtn) payBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Verifying Payment...`;

    try {
        const payload = {
            razorpayOrderId: razorpayResponse.razorpay_order_id,
            razorpayPaymentId: razorpayResponse.razorpay_payment_id,
            razorpaySignature: razorpayResponse.razorpay_signature
        };

        const response = await fetch(`${BASE_URL}/payment/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Payment verification failed.");
        }

        // Success! Clear cart and redirect to order confirmation
        localStorage.removeItem(CART_STORAGE_KEY);
        updateCartCounter();
        showToast("Payment verified! Order confirmed.", "success");

        setTimeout(() => {
            window.location.href = `order-confirmation.html?orderId=${result.id}`;
        }, 1000);

    } catch (error) {
        console.error("Payment verification error:", error);
        showToast("Payment verification failed: " + error.message, "error");
        resetPayBtn();
    }
}

function resetPayBtn() {
    isProcessingCheckout = false;
    const payBtn = document.getElementById("payNowBtn");
    if (payBtn) {
        payBtn.disabled = false;
        payBtn.innerHTML = `Proceed to Payment`;
    }
}

document.addEventListener("DOMContentLoaded", initCheckoutPage);
