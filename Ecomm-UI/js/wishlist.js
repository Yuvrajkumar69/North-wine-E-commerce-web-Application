// North & Vine — Wishlist Management

async function toggleWishlist(productId) {
    const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;
    if (!user) {
        showToast("Please sign in to add items to your wishlist.", "info");
        if (typeof openAuth === "function") openAuth("login");
        return;
    }

    try {
        // Check if currently in wishlist
        const checkRes = await fetch(`${BASE_URL}/wishlist/${user.id}/check/${productId}`);
        let inWishlist = false;
        if (checkRes.ok) {
            const checkData = await checkRes.json();
            inWishlist = checkData.inWishlist;
        }

        if (inWishlist) {
            // Remove
            const delRes = await fetch(`${BASE_URL}/wishlist/${user.id}/remove/${productId}`, {
                method: "DELETE"
            });
            if (delRes.ok) {
                showToast("Item removed from wishlist.", "info");
                updateWishlistBtnUI(productId, false);
            }
        } else {
            // Add
            const addRes = await fetch(`${BASE_URL}/wishlist/${user.id}/add/${productId}`, {
                method: "POST"
            });
            if (addRes.ok) {
                showToast("Item added to wishlist!", "success");
                updateWishlistBtnUI(productId, true);
            }
        }

        // If on wishlist page, reload list
        if (document.getElementById("wishlist-grid")) {
            loadWishlistPage();
        }

    } catch (error) {
        console.error("Error toggling wishlist:", error);
        showToast("Could not update wishlist. Please try again.", "error");
    }
}

function updateWishlistBtnUI(productId, isWishlisted) {
    const cards = document.querySelectorAll(`.product-card[data-id="${productId}"] .wishlist-card-btn`);
    cards.forEach(btn => {
        if (isWishlisted) {
            btn.classList.add("active");
            btn.innerHTML = `<i class="fas fa-heart"></i>`;
        } else {
            btn.classList.remove("active");
            btn.innerHTML = `<i class="far fa-heart"></i>`;
        }
    });

    const detailBtn = document.getElementById("detailWishlistBtn");
    if (detailBtn) {
        if (isWishlisted) {
            detailBtn.innerHTML = `<i class="fas fa-heart" style="color:var(--wine);"></i>`;
        } else {
            detailBtn.innerHTML = `<i class="far fa-heart"></i>`;
        }
    }
}

async function loadWishlistPage() {
    const grid = document.getElementById("wishlist-grid");
    if (!grid) return;

    const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;
    if (!user) {
        grid.innerHTML = `
            <div class="empty-state">
                Please sign in to view your saved wishlist.
                <div style="margin-top:16px;">
                    <button class="btn-gold" onclick="openAuth('login')">Sign In</button>
                </div>
            </div>`;
        return;
    }

    grid.innerHTML = `<div class="empty-state"><i class="fas fa-spinner fa-spin"></i> Loading wishlist...</div>`;

    try {
        const response = await fetch(`${BASE_URL}/wishlist/${user.id}`);
        if (!response.ok) {
            throw new Error(`Status ${response.status}`);
        }
        const items = await response.json();

        if (!items || items.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    Your wishlist is currently empty.
                    <div style="margin-top:16px;">
                        <a href="index.html" class="btn-gold">Explore Store</a>
                    </div>
                </div>`;
            return;
        }

        grid.innerHTML = items.map(item => renderWishlistItem(item)).join("");

    } catch (error) {
        console.error("Error loading wishlist page:", error);
        grid.innerHTML = `<div class="load-error">Could not load wishlist items. Please verify backend server.</div>`;
    }
}

function renderWishlistItem(item) {
    const name = escapeHtml(item.productName);
    const category = escapeHtml(item.productCategory || "Shop");
    const imgUrl = item.productImageUrl || 'img/img1.png';

    return `
        <div class="product-card" data-id="${item.productId}">
            <div class="thumb-wrap">
                <button class="wishlist-card-btn active" 
                        onclick="toggleWishlist(${item.productId})" 
                        title="Remove from Wishlist">
                    <i class="fas fa-heart"></i>
                </button>
                <a href="product-detail.html?id=${item.productId}">
                    <img src="${imgUrl}" alt="${name}" loading="lazy" onerror="this.src='img/img1.png'">
                </a>
            </div>
            <div class="body">
                <span class="cat-label">${category}</span>
                <h3><a href="product-detail.html?id=${item.productId}">${name}</a></h3>
                <div class="card-footer-row">
                    <span class="price-tag">${formatCurrency(item.productPrice)}</span>
                    <button class="add-cart-btn"
                        onclick="addToCart(${item.productId}, '${escapeForAttr(item.productName)}', ${item.productPrice}, '${escapeForAttr(imgUrl)}')">
                        <i class="fas fa-plus"></i> Move to Bag
                    </button>
                </div>
            </div>
        </div>
    `;
}

document.addEventListener("DOMContentLoaded", loadWishlistPage);
