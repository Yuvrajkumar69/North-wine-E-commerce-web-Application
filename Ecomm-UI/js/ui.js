// North & Vine Shared UI Helpers & Utilities

function ensureToastStack() {
    let stack = document.querySelector(".toast-stack");
    if (!stack) {
        stack = document.createElement("div");
        stack.className = "toast-stack";
        document.body.appendChild(stack);
    }
    return stack;
}

function showToast(message, type = "success", duration = 3500) {
    const stack = ensureToastStack();
    const el = document.createElement("div");
    el.className = "toast-msg " + type;

    let iconClass = "fas fa-check-circle";
    if (type === "error") iconClass = "fas fa-exclamation-circle";
    else if (type === "info") iconClass = "fas fa-info-circle";

    el.innerHTML = `<i class="${iconClass}"></i> <span>${escapeHtml(message)}</span>`;
    stack.appendChild(el);

    setTimeout(() => {
        el.style.opacity = "0";
        el.style.transform = "translateY(8px)";
        el.style.transition = "all 0.25s ease";
        setTimeout(() => el.remove(), 250);
    }, duration);
}

function toggleMobileNav() {
    const navLinks = document.querySelector(".nav-links");
    if (navLinks) {
        navLinks.classList.toggle("show");
    }
}
