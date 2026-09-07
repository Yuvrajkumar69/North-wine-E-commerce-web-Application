// Handles login/register modal and current user session (stored in localStorage)

const CURRENT_USER_KEY = "currentUser";
let authMode = "login"; // "login" | "register"

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
    } catch (e) {
        return null;
    }
}

function setCurrentUser(user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    renderAuthState();
}

function logout() {
    localStorage.removeItem(CURRENT_USER_KEY);
    renderAuthState();
    showToast("Signed out successfully.", "info");
}

function renderAuthState() {
    const area = document.getElementById("navAuthArea");
    if (!area) return;
    const user = getCurrentUser();

    if (user) {
        area.innerHTML = `
            <div class="user-chip">
                <span>Hi, <strong>${escapeHtml(user.name)}</strong></span>
                <a href="wishlist.html" class="link-btn" title="Wishlist"><i class="far fa-heart"></i></a>
                <a href="orders.html" class="link-btn">Orders</a>
                <button class="link-btn" onclick="logout()">Sign Out</button>
            </div>
        `;
    } else {
        area.innerHTML = `
            <a href="wishlist.html" class="link-btn" title="Wishlist" style="margin-right: 12px;"><i class="far fa-heart"></i> Wishlist</a>
            <button class="link-btn" onclick="openAuth('login')">Sign In</button>
        `;
    }
}

function openAuth(mode) {
    authMode = mode;
    applyAuthMode();
    const overlay = document.getElementById("authOverlay");
    if (overlay) overlay.classList.add("open");
    const errorEl = document.getElementById("authError");
    if (errorEl) errorEl.classList.remove("show");
}

function closeAuth() {
    const overlay = document.getElementById("authOverlay");
    if (overlay) overlay.classList.remove("open");
    const form = document.getElementById("authForm");
    if (form) form.reset();
}

function toggleAuthMode() {
    authMode = authMode === "login" ? "register" : "login";
    applyAuthMode();
}

function applyAuthMode() {
    const isLogin = authMode === "login";
    const title = document.getElementById("authTitle");
    const sub = document.getElementById("authSub");
    const nameField = document.getElementById("nameField");
    const phoneField = document.getElementById("phoneField");
    const submitBtn = document.getElementById("authSubmitBtn");
    const switchText = document.getElementById("authSwitchText");
    const switchBtn = document.getElementById("authSwitchBtn");
    const errorEl = document.getElementById("authError");

    if (title) title.textContent = isLogin ? "Sign in to North & Vine" : "Create an account";
    if (sub) sub.textContent = isLogin
        ? "Enter your email and password to access your account and orders."
        : "Takes less than a minute. Save your shipping address and wishlist.";
    if (nameField) nameField.style.display = isLogin ? "none" : "block";
    if (phoneField) phoneField.style.display = isLogin ? "none" : "block";
    if (submitBtn) submitBtn.textContent = isLogin ? "Sign In" : "Create Account";
    if (switchText) switchText.textContent = isLogin ? "New to North & Vine?" : "Already have an account?";
    if (switchBtn) switchBtn.textContent = isLogin ? "Create an account" : "Sign in instead";
    if (errorEl) errorEl.classList.remove("show");
}

async function handleAuthSubmit(event) {
    event.preventDefault();
    const errorEl = document.getElementById("authError");
    if (errorEl) errorEl.classList.remove("show");

    const email = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value;
    const nameInput = document.getElementById("authName");
    const phoneInput = document.getElementById("authPhone");
    const name = nameInput ? nameInput.value.trim() : "";
    const phone = phoneInput ? phoneInput.value.trim() : "";

    try {
        let response, payload;
        if (authMode === "login") {
            response = await fetch(`${BASE_URL}/users/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });
        } else {
            response = await fetch(`${BASE_URL}/users/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, phone })
            });
        }

        payload = await response.json();

        if (!response.ok) {
            const message = payload.fieldErrors
                ? Object.values(payload.fieldErrors)[0]
                : (payload.message || payload.error || "Something went wrong. Please try again.");
            if (errorEl) {
                errorEl.textContent = message;
                errorEl.classList.add("show");
            }
            return false;
        }

        setCurrentUser({ id: payload.id, name: payload.name, email: payload.email, phone: payload.phone });
        closeAuth();
        showToast(authMode === "login" ? `Welcome back, ${payload.name}.` : `Account created. Welcome to North & Vine, ${payload.name}.`, "success");
    } catch (error) {
        console.error("Auth error:", error);
        if (errorEl) {
            errorEl.textContent = "Could not reach North & Vine server. Please verify backend is running.";
            errorEl.classList.add("show");
        }
    }
    return false;
}

document.addEventListener("DOMContentLoaded", renderAuthState);
