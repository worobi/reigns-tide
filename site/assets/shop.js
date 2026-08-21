const shopConfig = window.REIGNS_TIDE_CONFIG || {};

const fallbackProducts = [];
const checkoutEndpoint = `${shopConfig.shopProductsEndpoint || ""}/checkout`;

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
            <label>
              <span>Option</span>
              <select data-variant-select="${escapeHtml(product.id)}">
                ${(product.variants || [])
                  .map(
                    (variant) =>
                      `<option value="${escapeHtml(variant.id)}" ${variant.in_stock ? "" : "disabled"}>${escapeHtml(variant.name)}${variant.price ? ` - $${escapeHtml(variant.price)}` : ""}</option>`,
                  )
                  .join("")}
              </select>
            </label>
            <button class="button primary" type="button" data-checkout-product="${escapeHtml(product.id)}">Checkout</button>
          </div>
        </article>
      `,
    )
    .join("");
};

const startCheckout = async (button) => {
  const productId = button.dataset.checkoutProduct;
  const select = document.querySelector(`[data-variant-select="${CSS.escape(productId)}"]`);
  const variantId = select?.value || "";

  button.disabled = true;
  button.textContent = "Opening checkout...";

  try {
    const response = await fetch(checkoutEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variant_id: variantId, quantity: 1 }),
    });
    const payload = await response.json();
    if (!response.ok || !payload.url) throw new Error(payload.error || "Checkout failed");
    window.location.href = payload.url;
  } catch (error) {
    button.textContent = "Try again";
    button.disabled = false;
    alert(error.message || "Checkout could not be started.");
  }
};

fetchProducts().then((products) => {
  renderProducts(products);
  document.querySelectorAll("[data-checkout-product]").forEach((button) => {
    button.addEventListener("click", () => startCheckout(button));
  });
});
