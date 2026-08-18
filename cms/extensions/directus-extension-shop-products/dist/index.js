const asProduct = (product) => {
  const externalUrl = /^https?:\/\//.test(product.external_id || "") ? product.external_id : "";

  return {
    title: product.name || "Reign's Tide item",
    description: product.synced
      ? `${product.synced} made-to-order option${product.synced === 1 ? "" : "s"} available.`
      : "Made to order through Printful.",
    image: product.thumbnail_url || "",
    url: externalUrl,
    price: "",
  };
};

const isEnabled = (value) => value === true || String(value).toLowerCase() === "true";

export default {
  id: "shop-products",
  handler: (router, { env }) => {
    router.get("/", async (req, res) => {
      if (!isEnabled(env.STORE_ENABLED)) {
        return res.json({ products: [] });
      }

      if (!env.PRINTFUL_API_KEY) {
        return res.json({ products: [] });
      }

      const headers = {
        Authorization: `Bearer ${env.PRINTFUL_API_KEY}`,
      };

      if (env.PRINTFUL_STORE_ID) {
        headers["X-PF-Store-Id"] = env.PRINTFUL_STORE_ID;
      }

      try {
        const response = await fetch("https://api.printful.com/store/products", {
          headers,
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) throw new Error(`Printful ${response.status}`);

        const payload = await response.json();
        const products = Array.isArray(payload.result) ? payload.result.map(asProduct) : [];

        res.set("Cache-Control", "public, max-age=300");
        return res.json({ products });
      } catch (error) {
        return res.status(502).json({ products: [] });
      }
    });
  },
};
