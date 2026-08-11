# Printful Shop API Plan

The public shop page is `site/shop.html`.

The browser should not call Printful directly because the Printful API token must stay private. Instead, the Directus extension at `cms/extensions/directus-extension-shop-products` talks to Printful server-side and returns public product data to the page.

## Front-End Config

`site/assets/config.js` points the shop page to:

```js
shopProductsEndpoint: "https://cms.reignstide.org/shop-products"
```

Until the VPS has `PRINTFUL_API_KEY` set and Directus is restarted, the page shows a coming-soon product card.

## Private Backend Env

Set these on the VPS:

```text
PRINTFUL_API_KEY=
PRINTFUL_STORE_ID=
```

`PRINTFUL_STORE_ID` is only needed if the token is account-level instead of single-store.

## Product JSON Shape

The page expects:

```json
{
  "products": [
    {
      "title": "Product name",
      "description": "Short product description",
      "image": "https://example.com/product-image.jpg",
      "url": "https://example.com/buy-link",
      "price": "$25.00"
    }
  ]
}
```

## Shop Message

Use this policy text on shop/product pages:

All proceeds after product cost go toward Kerrin Bowerson / Reign's Tide. Items are fulfilled through Printful's print network as close to the buyer's location as available to help keep shipping times short. Everything is made to order. If someone does not see what they are looking for, they can reach out and we can look into getting it created or added to honor Reign.
