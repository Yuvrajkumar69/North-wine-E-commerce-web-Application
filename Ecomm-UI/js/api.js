const BASE_URL="http://localhost:8080"

function escapeForAttr(str) {
    return String(str).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

function renderProductCard(product) {
    const name = escapeHtml(product.name);
    const desc = escapeHtml(product.description || "");
    const category = escapeHtml(product.category || "Shop");

    return `
        <div class="product-card">
            <div class="thumb">
                <img src="${product.imageUrl}" alt="${name}" loading="lazy">
            </div>
            <div class="body">
                <span class="cat-label">${category}</span>
                <h3>${name}</h3>
                <p class="desc">${desc}</p>
                <div class="card-footer-row">
                    <span class="price-tag">₹${product.price}</span>
                    <button class="add-cart-btn"
                        onclick="addToCart(${product.id}, '${escapeForAttr(product.name)}', ${product.price}, '${escapeForAttr(product.imageUrl)}')">
                        <i class="fas fa-plus"></i> Add
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function loadProducts()
{
    let trendingList=document.getElementById("trending-products");
    let clothingList=document.getElementById("clothing-products");
    let electronicsList=document.getElementById("electronics-products");

    try{
        const response = await fetch(`${BASE_URL}/products`);
        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }
        const products= await response.json();

        trendingList.innerHTML="";
        clothingList.innerHTML="";
        electronicsList.innerHTML="";

        if(products.length===0)
        {
            trendingList.innerHTML="<div class='empty-state'>No products available yet. Check back soon.</div>";
            return;
        }

        products.forEach((product) => {
            const cardHtml = renderProductCard(product);

            if(product.category==="Clothing")
            {
                clothingList.innerHTML+= cardHtml;
            }
            else if(product.category==="Electronics")
            {
                electronicsList.innerHTML+= cardHtml;
            }
            else{
                trendingList.innerHTML+= cardHtml;
            }
        });

    }
    catch(error)
    {
        console.log("Error fetching products:",error);
        const message = "<div class='load-error'>Could not load products. Please make sure the backend server is running on port 8080, then refresh.</div>";
        if(trendingList) trendingList.innerHTML = message;
        if(clothingList) clothingList.innerHTML = "";
        if(electronicsList) electronicsList.innerHTML = "";
    }
}
