const shopConfig = window.REIGNS_TIDE_CONFIG || {};

const fallbackProducts = [];

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const fetchProducts = async () => {
  if (!shopConfig.shopProductsEndpoint) return fallbackProducts;

  try {
    const response = await fetch(shopConfig.shopProductsEndpoint);
    if (!response.ok) throw new Error("Could not load shop products");
    const payload = await response.json();
    return Array.isArray(payload.products) ? payload.products : fallbackProducts;
  } catch (error) {
    console.warn(error);
    return fallbackProducts;
  }
};

const renderProducts = (products) => {
  const target = document.querySelector("#product-list");

  if (!products.length) {
    target.innerHTML = `<p class="empty">No shop items are listed right now.</p>`;
    return;
  }

  target.innerHTML = products
    .map(
      (product) => `
        <article class="product-card">
          <div class="product-image-wrap">
            <img src="${escapeHtml(product.image || "assets/reign-logo.png")}" alt="${escapeHtml(product.title || "Reign's Tide product")}">
          </div>
          <div class="product-body">
            <h3>${escapeHtml(product.title || "Shop item")}</h3>
            ${product.price ? `<p class="product-price">${escapeHtml(product.price)}</p>` : ""}
            <p>${escapeHtml(product.description || "")}</p>
            ${
              product.url
                ? `<a class="button primary" href="${escapeHtml(product.url)}" rel="noopener noreferrer" target="_blank">View item</a>`
                : `<span class="product-coming-soon">Item details are being finalized.</span>`
            }
          </div>
        </article>
      `,
    )
    .join("");
};

fetchProducts().then(renderProducts);
