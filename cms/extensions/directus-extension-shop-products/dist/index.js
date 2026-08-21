const isEnabled = (value) => value === true || String(value).toLowerCase() === "true";
const money = (value) => Math.max(0, Math.round(Number(value || 0) * 100));

const printfulHeaders = (env) => {
  const headers = { Authorization: `Bearer ${env.PRINTFUL_API_KEY}` };
  if (env.PRINTFUL_STORE_ID) headers["X-PF-Store-Id"] = env.PRINTFUL_STORE_ID;
  return headers;
};

const printfulFetch = async (env, path) => {
  const response = await fetch(`https://api.printful.com${path}`, {
    headers: printfulHeaders(env),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Printful ${response.status}`);
  return response.json();
};

const stripeFetch = async (env, path, body) => {
  const response = await fetch(`https://api.stripe.com${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    signal: AbortSignal.timeout(10000),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message || `Stripe ${response.status}`);
  return payload;
};

const getProducts = async (env) => {
  const list = await printfulFetch(env, "/store/products");
  const syncProducts = Array.isArray(list.result) ? list.result.filter((product) => !product.is_ignored) : [];
  const details = await Promise.all(
    syncProducts.slice(0, 24).map(async (product) => {
      try {
        const detail = await printfulFetch(env, `/store/products/${product.id}`);
        const variants = Array.isArray(detail.result?.sync_variants) ? detail.result.sync_variants : [];
        return {
          id: String(product.id),
          title: product.name || "Reign's Tide item",
          image: product.thumbnail_url || detail.result?.sync_product?.thumbnail_url || "",
          variants: variants
            .filter((variant) => !variant.is_ignored)
            .map((variant) => ({
              id: String(variant.id),
              name: variant.name || variant.sku || "Option",
              price: variant.retail_price || "",
              in_stock: variant.availability_status !== "discontinued",
            })),
        };
      } catch {
        return null;
      }
    }),
  );
  return details.filter(Boolean).filter((product) => product.variants.length);
};

export default {
  id: "shop-products",
  handler: (router, { env }) => {
    router.get("/", async (req, res) => {
      if (!isEnabled(env.STORE_ENABLED) || !env.PRINTFUL_API_KEY) return res.json({ products: [] });
      try {
        const products = await getProducts(env);
        res.set("Cache-Control", "public, max-age=300");
        return res.json({ products });
      } catch {
        return res.status(502).json({ products: [] });
      }
    });

    router.post("/checkout", async (req, res) => {
      if (!isEnabled(env.STORE_ENABLED) || !env.PRINTFUL_API_KEY || !env.STRIPE_SECRET_KEY) {
        return res.status(503).json({ error: "Shop checkout is not configured." });
      }

      const variantId = String(req.body?.variant_id || "");
      const quantity = Math.min(10, Math.max(1, Number.parseInt(req.body?.quantity || "1", 10)));
      if (!variantId) return res.status(400).json({ error: "Choose an item first." });

      try {
        const products = await getProducts(env);
        const product = products.find((item) => item.variants.some((variant) => variant.id === variantId));
        const variant = product?.variants.find((item) => item.id === variantId);
        if (!product || !variant || !variant.in_stock || !money(variant.price)) {
          return res.status(400).json({ error: "This item is not available." });
        }

        const origin = env.SHOP_PUBLIC_URL || "https://reignstide.org/shop.html";
        const params = new URLSearchParams({
          mode: "payment",
          success_url: `${origin}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}?checkout=cancelled`,
          "shipping_address_collection[allowed_countries][0]": "US",
          "metadata[printful_sync_variant_id]": variant.id,
          "metadata[printful_product_title]": product.title,
          "line_items[0][quantity]": String(quantity),
          "line_items[0][price_data][currency]": (env.STRIPE_CURRENCY || "usd").toLowerCase(),
          "line_items[0][price_data][unit_amount]": String(money(variant.price)),
          "line_items[0][price_data][product_data][name]": `${product.title} - ${variant.name}`,
        });
        if (product.image) params.set("line_items[0][price_data][product_data][images][0]", product.image);

        const session = await stripeFetch(env, "/v1/checkout/sessions", params);
        return res.json({ url: session.url });
      } catch {
        return res.status(502).json({ error: "Checkout could not be started." });
      }
    });
  },
};
