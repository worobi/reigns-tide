# Stories Turnstile Setup

The stories page is ready to show Cloudflare Turnstile, but full spam protection needs a backend verification step before Directus accepts the note.

## Public Site

In `site/assets/config.js`, set:

```js
window.REIGNS_TIDE_CONFIG = {
  cmsUrl: "https://cms.reignstide.org",
  shopProductsEndpoint: "https://cms.reignstide.org/shop-products",
  turnstileSiteKey: "your-public-turnstile-sitekey",
  storySubmitEndpoint: "https://cms.reignstide.org/story-submit",
};
```

The site key is public and safe to place in the browser.

## Cloudflare Widget

Create one managed Turnstile widget for:

- `reignstide.org`
- `www.reignstide.org`

For local browser testing, use Cloudflare's test keys or add local hostnames to a separate development widget.

## Backend Verification Contract

The backend route should accept the story payload and `cf-turnstile-response`, then call:

```text
POST https://challenges.cloudflare.com/turnstile/v0/siteverify
```

The request must include:

- `secret`: `TURNSTILE_SECRET` from the VPS environment
- `response`: the visitor token from `cf-turnstile-response`
- `remoteip`: the visitor IP when available

Reject the submission unless all of these are true:

- `success === true`
- `action === "story"`
- `hostname` is `reignstide.org` or `www.reignstide.org`

After verification passes, create the Directus `remembrance_notes` item with:

- `name`
- `relationship`
- `message`
- `is_approved: false`
- `display_on_site: true`

Do not expose `TURNSTILE_SECRET` in `site/assets/config.js`, HTML, JavaScript, or chat.

## Directus Permissions

Once the verified endpoint is live, remove public direct create access for `remembrance_notes`. Otherwise a bot could skip the story page and post straight to Directus.

## Local Preview

The current in-browser `file://` preview can show the placeholder text, but Turnstile itself should be tested over `http://localhost` or the live domain.
