// Shared UI helpers used across pages: toast notifications (replaces jarring alert() calls)

function ensureToastStack() {
    let stack = document.querySelector(".toast-stack");
    if (!stack) {
        stack = document.createElement("div");
        stack.className = "toast-stack";
        document.body.appendChild(stack);
    }
    return stack;
}

function showToast(message, type = "success", duration = 3200) {
    const stack = ensureToastStack();
    const el = document.createElement("div");
    el.className = "toast-msg" + (type === "error" ? " error" : "");
    el.textContent = message;
    stack.appendChild(el);
    setTimeout(() => {
        el.style.opacity = "0";
        el.style.transition = "opacity 0.2s ease";
        setTimeout(() => el.remove(), 200);
    }, duration);
}
