// North & Vine API Configuration & Core Renderers
const BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:')
    ? 'http://localhost:8080'
    : 'https://north-wine-e-commerce-web-application-production.up.railway.app';

function escapeForAttr(str) {
    if (!str) return '';
    return String(str).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, "&quot;");
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

function formatCurrency(amount) {
    const num = Number(amount) || 0;
    return "₹" + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function renderProductCard(product, wishlistedIds = []) {
    const name = escapeHtml(product.name);
    const desc = escapeHtml(product.description || "");
    const category = escapeHtml(product.category || "Shop");
    const imgUrl = product.imageUrl || 'img/img1.png';
    const isWishlisted = wishlistedIds.includes(product.id);
    
    const wasPriceHtml = product.originalPrice && Number(product.originalPrice) > Number(product.price)
        ? `<span class="was-price">${formatCurrency(product.originalPrice)}</span>`
        : '';

    const stockBadge = (product.stock !== null && product.stock !== undefined && product.stock <= 0)
        ? `<span class="badge-discount" style="background: var(--text-muted); position: absolute; top: 10px; left: 10px; z-index: 5;">Out of Stock</span>`
        : '';

    return `
        <div class="product-card" data-id="${product.id}">
            <div class="thumb-wrap">
                ${stockBadge}
                <button class="wishlist-card-btn ${isWishlisted ? 'active' : ''}" 
                        onclick="event.stopPropagation(); toggleWishlist(${product.id})" 
                        title="${isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}">
                    <i class="${isWishlisted ? 'fas' : 'far'} fa-heart"></i>
                </button>
                <a href="product-detail.html?id=${product.id}">
                    <img src="${imgUrl}" alt="${name}" loading="lazy" onerror="this.src='img/img1.png'">
                </a>
            </div>
            <div class="body">
                <span class="cat-label">${category}</span>
                <h3><a href="product-detail.html?id=${product.id}">${name}</a></h3>
                <p class="desc">${desc}</p>
                <div class="card-footer-row">
                    <span class="price-tag">${wasPriceHtml}${formatCurrency(product.price)}</span>
                    <button class="add-cart-btn"
                        onclick="addToCart(${product.id}, '${escapeForAttr(product.name)}', ${product.price}, '${escapeForAttr(imgUrl)}')">
                        <i class="fas fa-plus"></i> Add
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function loadProducts(categoryFilter = null, keywordSearch = null) {
    let trendingList = document.getElementById("trending-products");
    let clothingList = document.getElementById("clothing-products");
    let electronicsList = document.getElementById("electronics-products");

    try {
        let wishlistedIds = [];
        const user = getCurrentUser();
        if (user && user.id) {
            try {
                const wishRes = await fetch(`${BASE_URL}/wishlist/${user.id}`);
                if (wishRes.ok) {
                    const wishItems = await wishRes.json();
                    wishlistedIds = wishItems.map(w => w.productId);
                }
            } catch (e) {
                console.warn("Could not load wishlist for user card state", e);
            }
        }

        let endpoint = `${BASE_URL}/products`;
        if (categoryFilter) {
            endpoint = `${BASE_URL}/products/category/${encodeURIComponent(categoryFilter)}`;
        } else if (keywordSearch) {
            endpoint = `${BASE_URL}/products/search?keyword=${encodeURIComponent(keywordSearch)}`;
        }

        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }
        const products = await response.json();

        if (trendingList) trendingList.innerHTML = "";
        if (clothingList) clothingList.innerHTML = "";
        if (electronicsList) electronicsList.innerHTML = "";

        if (!products || products.length === 0) {
            const emptyMsg = "<div class='empty-state'>No products found. Try a different category or search term.</div>";
            if (trendingList) trendingList.innerHTML = emptyMsg;
            return;
        }

        products.forEach((product) => {
            const cardHtml = renderProductCard(product, wishlistedIds);

            if (!categoryFilter && !keywordSearch) {
                if (product.category === "Clothing" && clothingList) {
                    clothingList.innerHTML += cardHtml;
                } else if (product.category === "Electronics" && electronicsList) {
                    electronicsList.innerHTML += cardHtml;
                } else if (trendingList) {
                    trendingList.innerHTML += cardHtml;
                }
            } else {
                if (trendingList) trendingList.innerHTML += cardHtml;
            }
        });

    } catch (error) {
        console.error("Error fetching products:", error);
        const message = `<div class='load-error'>Could not connect to North & Vine server. Make sure Spring Boot is running at <code>${BASE_URL}</code>.</div>`;
        if (trendingList) trendingList.innerHTML = message;
        if (clothingList) clothingList.innerHTML = "";
        if (electronicsList) electronicsList.innerHTML = "";
    }
}
