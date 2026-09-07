// North & Vine — Product Detail Renderer & Interactions

let currentProduct = null;
let selectedQuantity = 1;

async function initProductDetail() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    const detailContainer = document.getElementById("product-detail-container");
    if (!detailContainer) return;

    if (!productId) {
        detailContainer.innerHTML = `<div class="empty-state">No product selected. <a href="index.html" class="btn-gold" style="margin-top:12px;">Browse Store</a></div>`;
        return;
    }

    detailContainer.innerHTML = `<div class="empty-state"><i class="fas fa-spinner fa-spin"></i> Loading product details...</div>`;

    try {
        const response = await fetch(`${BASE_URL}/products/${productId}`);
        if (!response.ok) {
            throw new Error(`Product not found (Status ${response.status})`);
        }
        currentProduct = await response.json();
        renderProductDetail(currentProduct);
        loadRelatedProducts(currentProduct.category, currentProduct.id);
    } catch (error) {
        console.error("Error loading product detail:", error);
        detailContainer.innerHTML = `<div class="load-error">Could not load product details. ${escapeHtml(error.message)}</div>`;
    }
}

function renderProductDetail(product) {
    const detailContainer = document.getElementById("product-detail-container");
    const name = escapeHtml(product.name);
    const category = escapeHtml(product.category || "Shop");
    const desc = escapeHtml(product.description || "No description provided for this product.");
    const mainImg = product.imageUrl || 'img/img1.png';

    const images = [mainImg];
    if (product.imageUrl2) images.push(product.imageUrl2);
    if (product.imageUrl3) images.push(product.imageUrl3);

    const wasPriceHtml = product.originalPrice && Number(product.originalPrice) > Number(product.price)
        ? `<span style="text-decoration:line-through; color:var(--text-muted); font-size:1.1rem; margin-right:8px;">${formatCurrency(product.originalPrice)}</span>`
        : '';

    const inStock = product.stock === null || product.stock === undefined || product.stock > 0;
    const stockStatusHtml = inStock
        ? `<span style="color:var(--sage); font-size:0.85rem; font-weight:600;"><i class="fas fa-check-circle"></i> In Stock ${product.stock ? `(${product.stock} available)` : ''}</span>`
        : `<span style="color:var(--wine); font-size:0.85rem; font-weight:600;"><i class="fas fa-times-circle"></i> Currently Out of Stock</span>`;

    const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;

    detailContainer.innerHTML = `
        <div class="product-detail-layout">
            <div class="gallery-col">
                <div class="gallery-main">
                    <img id="mainGalleryImg" src="${images[0]}" alt="${name}" onerror="this.src='img/img1.png'">
                </div>
                ${images.length > 1 ? `
                    <div class="gallery-thumbs">
                        ${images.map((img, idx) => `
                            <div class="gallery-thumb ${idx === 0 ? 'active' : ''}" onclick="switchGalleryImage('${escapeForAttr(img)}', this)">
                                <img src="${img}" alt="${name} thumb ${idx+1}" onerror="this.src='img/img1.png'">
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>

            <div class="detail-info">
                <div>
                    <span class="cat-label">${category}</span>
                    <h1 class="detail-title">${name}</h1>
                    <div style="margin-top:6px;">${stockStatusHtml}</div>
                </div>

                <div class="detail-price-row">
                    ${wasPriceHtml}
                    <span class="detail-price">${formatCurrency(product.price)}</span>
                </div>

                <p class="detail-desc">${desc}</p>

                <div class="detail-actions">
                    <div class="qty-control" style="padding: 6px 12px;">
                        <button onclick="updateQty(-1)" aria-label="Decrease quantity">&minus;</button>
                        <span id="qtyDisplay" style="font-size:1rem; padding:0 8px;">1</span>
                        <button onclick="updateQty(1)" aria-label="Increase quantity">+</button>
                    </div>

                    <button class="btn-wine" onclick="handleAddToCartClick()" ${!inStock ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
                        <i class="fas fa-shopping-bag"></i> Add to Bag
                    </button>

                    <button class="btn-gold" onclick="handleBuyNowClick()" ${!inStock ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
                        Buy Now
                    </button>

                    <button class="nav-icon-btn" id="detailWishlistBtn" onclick="toggleWishlist(${product.id})" title="Wishlist" style="width:46px; height:46px;">
                        <i class="far fa-heart"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    checkDetailWishlistState(product.id);
}

function switchGalleryImage(src, thumbEl) {
    const mainImg = document.getElementById("mainGalleryImg");
    if (mainImg) mainImg.src = src;

    document.querySelectorAll(".gallery-thumb").forEach(t => t.classList.remove("active"));
    if (thumbEl) thumbEl.classList.add("active");
}

function updateQty(change) {
    selectedQuantity = Math.max(1, selectedQuantity + change);
    const display = document.getElementById("qtyDisplay");
    if (display) display.innerText = selectedQuantity;
}

function handleAddToCartClick() {
    if (!currentProduct) return;
    addToCart(currentProduct.id, currentProduct.name, currentProduct.price, currentProduct.imageUrl, selectedQuantity);
}

function handleBuyNowClick() {
    if (!currentProduct) return;
    buyNow(currentProduct.id, currentProduct.name, currentProduct.price, currentProduct.imageUrl, selectedQuantity);
}

async function checkDetailWishlistState(productId) {
    const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;
    const btn = document.getElementById("detailWishlistBtn");
    if (!user || !btn) return;

    try {
        const res = await fetch(`${BASE_URL}/wishlist/${user.id}/check/${productId}`);
        if (res.ok) {
            const data = await res.json();
            if (data.inWishlist) {
                btn.innerHTML = `<i class="fas fa-heart" style="color:var(--wine);"></i>`;
            }
        }
    } catch (e) {
        console.warn("Error checking wishlist state", e);
    }
}

async function loadRelatedProducts(category, currentId) {
    const container = document.getElementById("related-products-grid");
    if (!container || !category) return;

    try {
        const res = await fetch(`${BASE_URL}/products/category/${encodeURIComponent(category)}`);
        if (!res.ok) return;
        const products = await res.json();
        const related = products.filter(p => p.id !== currentId).slice(0, 4);

        if (related.length === 0) {
            const section = document.getElementById("related-section");
            if (section) section.style.display = "none";
            return;
        }

        container.innerHTML = related.map(p => renderProductCard(p)).join("");
    } catch (e) {
        console.warn("Could not load related products", e);
    }
}

document.addEventListener("DOMContentLoaded", initProductDetail);
