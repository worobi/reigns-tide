# Reign's Tide

A gentle, kid-friendly water-themed remembrance site for Reign with:

- events and gatherings
- photos
- donation/help links
- a public note/story form
- a simple admin area through Directus

The design keeps a soft tide/water feel while using gold accents for childhood cancer awareness. This is intentionally lighter than WordPress. The public site is plain HTML/CSS/JS, and the backend is Directus running in Docker on the VPS.

## Pages

- `site/index.html`: home and Mommy's message
- `site/events.html`: gatherings and event details
- `site/photos.html`: photo gallery
- `site/support.html`: donation and support links
- `site/shop.html`: Printful-ready shop page
- `site/stories.html`: note/story form and approved stories

## Local Preview

Open `site/index.html` in a browser, or serve the `site` folder with any basic web server.

The page uses sample content until `site/assets/config.js` has a real Directus URL.

## Hero Video

The hero is set up to use `site/assets/ocean-hero.webm`.

Replace that file when you have your preferred ocean video.

## Shop

The shop page is `site/shop.html`. It is ready for Printful-backed items through a private product endpoint, but it does not expose a Printful API token in the browser.

Setup notes are in `planning/printful-shop-api.md`.

## Stories Spam Protection

The stories page is ready for Cloudflare Turnstile.

Set `turnstileSiteKey` and `storySubmitEndpoint` in `site/assets/config.js` after the Turnstile widget and verified backend route exist.

The private `TURNSTILE_SECRET` belongs only on the VPS/CMS side. Do not put it in the public `site` folder. Setup notes are in `planning/turnstile-stories.md`.

## VPS Setup Shape

1. Copy `.env.example` to `.env`.
2. Change the domains, email, admin email, admin password, and secret.
3. Point DNS records for `reignstide.org`, `www.reignstide.org`, and `cms.reignstide.org` to the VPS.
4. Start the stack with Docker Compose.
5. Open the CMS/admin domain and create the collections listed in `cms/directus-setup.md`.
6. Confirm `site/assets/config.js` points to `https://cms.reignstide.org`.

## Recommended Domains

Use one public domain and one admin subdomain:

- `reignstide.org` for the public site
- `cms.reignstide.org` for the backend

Optional:

- `www.reignstide.org` can point to the same VPS and redirect to `reignstide.org`.

Keeping the CMS on its own subdomain avoids fragile subfolder routing and keeps the public site simple.

## Content Model

The CMS collections are documented in `cms/directus-setup.md`.

For submitted stories, keep moderation on. Public visitors can submit a note, but it should not appear on the site until someone approves it in Directus.
