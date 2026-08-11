# Directus Setup For Reign's Tide

Create these collections in the Directus admin area. The names matter because the public site reads them by API.

## Collection: `events`

Purpose: family gatherings, memorial events, fundraisers, vigils, meals, and support events.

Fields:

- `title`: string, required
- `event_date`: datetime, required
- `location`: string
- `address`: string
- `description`: text
- `button_label`: string
- `button_url`: string
- `is_featured`: boolean, default false
- `is_published`: boolean, default false
- `sort`: integer

Public read filter:

- Allow read only when `is_published` is true.

## Collection: `photos`

Purpose: photos shown in the gallery.

Fields:

- `title`: string
- `caption`: text
- `image`: file, required
- `taken_date`: date
- `is_published`: boolean, default false
- `sort`: integer

Public read filter:

- Allow read only when `is_published` is true.

## Collection: `donation_links`

Purpose: donation pages, meal trains, fundraisers, registry links, or other support links.

Fields:

- `title`: string, required
- `description`: text
- `url`: string, required
- `button_label`: string, default `Give support`
- `is_published`: boolean, default false
- `sort`: integer

Public read filter:

- Allow read only when `is_published` is true.

## Collection: `remembrance_notes`

Purpose: notes, stories, memories, and messages people leave for the family.

Fields:

- `name`: string, required
- `relationship`: string
- `message`: text, required
- `created_at`: datetime, default now
- `is_approved`: boolean, default false
- `display_on_site`: boolean, default true

Public permissions:

- During early setup only, allow create for `name`, `relationship`, and `message`.
- Once Turnstile is connected, remove direct public create access and route submissions through the verified story endpoint instead.
- Do not allow public updates or deletes.
- Allow public read only when `is_approved` is true and `display_on_site` is true.

## Admin Workflow

Events:

1. Add event details.
2. Turn on `is_published` when ready.
3. Use `is_featured` for the most important current event.

Initial event to add:

- Title: `Celebrating Our Sweet Reign`
- Date/time: `Saturday, August 22, 2026, 2:00 PM - 6:00 PM`
- Location: `The Barn At Fly Away Farm`
- Address: `3410 NE 70th St, Ocala, FL 34479`
- Description: `Please join us as we gather to celebrate the beautiful, inspirational spirit of sweet 3-year-old Reign and honor her homecoming to Heaven. While our hearts are full of love and remembrance, this day is dedicated to filling the air with joy, warmth, and light in her honor, just as she brought to everyone around her.`
- Planned details: `Balloon release and butterfly release; wet and dry bounce houses, waterslides, and a toddler bounce house; food, music, bubbles, and togetherness. Bring towels or a change of clothes if the kiddos plan on enjoying the waterslides.`
- Button label: `Get directions`
- Button URL: `https://www.google.com/maps/search/?api=1&query=3410%20NE%2070th%20St%2C%20Ocala%2C%20FL%2034479`
- Published: yes
- Featured: yes

Second event to add:

- Title: `Michigan Beach Day for Reign`
- Date/time: `Saturday, August 22, 2026, 3:00 PM - 8:00 PM, release at dusk`
- Location: `Lakeside Beach`
- Address: `Port Huron, MI`
- Description: `For those in Michigan who would like to come together and are unable to make it to Florida, we will gather for a beach day to honor Reign's homecoming to Heaven.`
- Planned details: `Beach day for family and friends; balloon and lantern release at dusk; come together in Michigan to honor Reign.`
- Button label: `Get directions`
- Button URL: `https://www.google.com/maps/search/?api=1&query=Lakeside%20Beach%2C%20Port%20Huron%2C%20MI`
- Published: yes
- Featured: no

Photos:

1. Upload photo.
2. Add a title or caption if wanted.
3. Turn on `is_published`.

Donation links:

1. Add the official link.
2. Add a short description.
3. Turn on `is_published`.

Initial link to add:

- Title: `Reign's GoFundMe`
- Description: `Support link for Reign's family.`
- URL: `https://gofund.me/27feaa2f4`
- Button label: `Open GoFundMe`

Stories:

1. Review new submissions.
2. Fix typos only if appropriate.
3. Turn on `is_approved` to show it on the public site.
4. Turn off `display_on_site` if the family wants to keep it private.

## Spam Note

The stories page has a Turnstile-ready widget container. Real spam protection requires the backend endpoint to verify the Turnstile token with Cloudflare before creating a `remembrance_notes` item.
