// Handles the login/register modal and the "current user" session (stored in localStorage,
// since this project has no real token/session backend yet).

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
    showToast("Signed out.");
}

function renderAuthState() {
    const area = document.getElementById("navAuthArea");
    if (!area) return;
    const user = getCurrentUser();

    if (user) {
        area.innerHTML = `
            <div class="user-chip">
                <span>Hi, <strong>${user.name}</strong></span>
                <a href="orders.html" class="link-btn">Orders</a>
                <button class="link-btn" onclick="logout()">Sign Out</button>
            </div>
        `;
    } else {
        area.innerHTML = `<button class="link-btn" onclick="openAuth('login')">Sign In</button>`;
    }
}

function openAuth(mode) {
    authMode = mode;
    applyAuthMode();
    document.getElementById("authOverlay").classList.add("open");
    document.getElementById("authError").classList.remove("show");
}

function closeAuth() {
    document.getElementById("authOverlay").classList.remove("open");
    document.getElementById("authForm").reset();
}

function toggleAuthMode() {
    authMode = authMode === "login" ? "register" : "login";
    applyAuthMode();
}

function applyAuthMode() {
    const isLogin = authMode === "login";
    document.getElementById("authTitle").textContent = isLogin ? "Sign in" : "Create an account";
    document.getElementById("authSub").textContent = isLogin
        ? "Welcome back. Enter your details to continue."
        : "Takes about a minute. You'll need this account to check out.";
    document.getElementById("nameField").style.display = isLogin ? "none" : "block";
    document.getElementById("authSubmitBtn").textContent = isLogin ? "Sign In" : "Create Account";
    document.getElementById("authSwitchText").textContent = isLogin ? "New here?" : "Already have an account?";
    document.getElementById("authSwitchBtn").textContent = isLogin ? "Create an account" : "Sign in instead";
    document.getElementById("authError").classList.remove("show");
}

async function handleAuthSubmit(event) {
    event.preventDefault();
    const errorEl = document.getElementById("authError");
    errorEl.classList.remove("show");

    const email = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value;
    const name = document.getElementById("authName").value.trim();

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
                body: JSON.stringify({ name, email, password })
            });
        }

        payload = await response.json();

        if (!response.ok) {
            const message = payload.fieldErrors
                ? Object.values(payload.fieldErrors)[0]
                : (payload.message || "Something went wrong. Please try again.");
            errorEl.textContent = message;
            errorEl.classList.add("show");
            return false;
        }

        setCurrentUser({ id: payload.id, name: payload.name, email: payload.email });
        closeAuth();
        showToast(authMode === "login" ? `Welcome back, ${payload.name}.` : `Account created. Welcome, ${payload.name}.`);
    } catch (error) {
        console.log("Auth error:", error);
        errorEl.textContent = "Could not reach the server. Please make sure it's running.";
        errorEl.classList.add("show");
    }
    return false;
}

document.addEventListener("DOMContentLoaded", renderAuthState);
