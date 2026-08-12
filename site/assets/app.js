const config = window.REIGNS_TIDE_CONFIG || {};
const cmsUrl = (config.cmsUrl || "").replace(/\/$/, "");
const storySubmitEndpoint = (config.storySubmitEndpoint || "").trim();
const turnstileSiteKey = (config.turnstileSiteKey || "").trim();
const turnstileState = {
  configured: false,
  token: "",
  widgetId: null,
};

const sampleData = {
  events: [
    {
      title: "Celebrating Our Sweet Reign",
      event_date: "2026-08-22T14:00:00-04:00",
      time_label: "2:00 PM - 6:00 PM",
      location: "The Barn At Fly Away Farm",
      address: "3410 NE 70th St, Ocala, FL 34479",
      description:
        "Please join us as we gather to celebrate the beautiful, inspirational spirit of sweet 3-year-old Reign and honor her homecoming to Heaven.",
      highlights: [
        "Balloon release and butterfly release",
        "Wet and dry bounce houses, waterslides, and a toddler bounce house",
        "Food, music, bubbles, and togetherness",
        "Bring towels or a change of clothes if the kiddos plan on enjoying the waterslides",
      ],
      button_label: "Get directions",
      button_url: "https://www.google.com/maps/search/?api=1&query=3410%20NE%2070th%20St%2C%20Ocala%2C%20FL%2034479",
      is_featured: true,
    },
    {
      title: "Michigan Beach Day for Reign",
      event_date: "2026-08-22T15:00:00-04:00",
      time_label: "3:00 PM - 8:00 PM, release at dusk",
      location: "Lakeside Beach",
      address: "Port Huron, MI",
      description:
        "For those in Michigan who would like to come together and are unable to make it to Florida, we will gather for a beach day to honor Reign's homecoming to Heaven.",
      highlights: [
        "Beach day for family and friends",
        "Balloon and lantern release at dusk",
        "Come together in Michigan to honor Reign",
      ],
      button_label: "Get directions",
      button_url: "https://www.google.com/maps/search/?api=1&query=Lakeside%20Beach%2C%20Port%20Huron%2C%20MI",
    },
  ],
  photos: [
    {
      title: "Photo title placeholder",
      caption: "Add a photo caption here.",
      image: null,
    },
    {
      title: "Photo title placeholder",
      caption: "Add a photo caption here.",
      image: null,
    },
    {
      title: "Photo title placeholder",
      caption: "Add a photo caption here.",
      image: null,
    },
  ],
  donation_links: [
    {
      title: "Reign's GoFundMe",
      description: "Support link for Reign's family.",
      button_label: "Open GoFundMe",
      url: "https://gofund.me/27feaa2f4",
    },
    {
      title: "Reign's Meal Train",
      description: "Help with meals and practical support for Kerrin Bowerson and family.",
      button_label: "Open Meal Train",
      url: "https://www.mealtrain.com/trains/9dy1dv",
    },
    {
      title: "Reign's Tide Shop",
      description: "Print-on-demand items honoring Reign. Proceeds after product cost go toward Kerrin Bowerson / Reign's Tide.",
      button_label: "Visit shop",
      url: "shop.html",
    },
  ],
  remembrance_notes: [
    {
      name: "Name placeholder",
      relationship: "Relationship placeholder",
      message: "Add a sample note or story here.",
    },
  ],
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const directusFileUrl = (file) => {
  if (!cmsUrl || !file) return "";
  const id = typeof file === "string" ? file : file.id;
  return id ? `${cmsUrl}/assets/${id}?width=1400&quality=84` : "";
};

const fetchItems = async (collection, query = "") => {
  if (!cmsUrl) return sampleData[collection] || [];

  try {
    const response = await fetch(`${cmsUrl}/items/${collection}${query}`);
    if (!response.ok) throw new Error(`Could not load ${collection}`);
    const payload = await response.json();
    return payload.data || [];
  } catch (error) {
    console.warn(error);
    return sampleData[collection] || [];
  }
};

const setFormStatus = (message) => {
  const status = document.querySelector("#form-status");
  if (status) status.textContent = message;
};

const resetTurnstile = () => {
  if (
    turnstileState.configured &&
    turnstileState.widgetId !== null &&
    window.turnstile &&
    typeof window.turnstile.reset === "function"
  ) {
    window.turnstile.reset(turnstileState.widgetId);
  }
  turnstileState.token = "";
};

const initTurnstile = () => {
  const container = document.querySelector("#turnstile-widget");
  if (!container) return;

  if (window.location.protocol === "file:") {
    container.innerHTML =
      '<p class="spam-check-note">Spam protection is connected for the live site and will load on reignstide.org.</p>';
    return;
  }

  if (!turnstileSiteKey) {
    container.innerHTML =
      '<p class="spam-check-note">Spam protection will appear here once the Turnstile site key and verified story endpoint are connected.</p>';
    return;
  }

  turnstileState.configured = true;

  window.reignsTideTurnstileLoaded = () => {
    if (!window.turnstile || turnstileState.widgetId !== null) return;

    turnstileState.widgetId = window.turnstile.render(container, {
      sitekey: turnstileSiteKey,
      action: "story",
      theme: "auto",
      size: "flexible",
      callback: (token) => {
        turnstileState.token = token;
      },
      "expired-callback": () => {
        turnstileState.token = "";
        setFormStatus("The spam check expired. Please complete it again before submitting.");
      },
      "error-callback": () => {
        turnstileState.token = "";
        setFormStatus("The spam check had an issue. Please refresh the page and try again.");
      },
    });
  };

  if (window.turnstile) {
    window.reignsTideTurnstileLoaded();
    return;
  }

  const existingScript = document.querySelector('script[src^="https://challenges.cloudflare.com/turnstile/v0/api.js"]');
  if (existingScript) return;

  const script = document.createElement("script");
  script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=reignsTideTurnstileLoaded";
  script.async = true;
  script.defer = true;
  script.onerror = () => {
    setFormStatus("The spam check could not load. Please refresh the page and try again.");
  };
  document.head.append(script);
};

const renderEvents = (events) => {
  const target = document.querySelector("#events-list");
  if (!target) return;
  if (!events.length) {
    target.innerHTML = `<p class="empty">No events have been published yet.</p>`;
    return;
  }

  target.innerHTML = events
    .map((event) => {
      const buttonUrl = event.button_url || "";
      const buttonLabel = event.button_label || "View details";
      const highlights = Array.isArray(event.highlights) ? event.highlights : [];
      return `
        <article class="card event-card${event.is_featured ? " featured-card" : ""}">
          <div>
            <div class="meta">${escapeHtml(formatDate(event.event_date))}</div>
            <h3>${escapeHtml(event.title)}</h3>
            ${event.time_label ? `<p class="event-time">${escapeHtml(event.time_label)}</p>` : ""}
            <p>${escapeHtml(event.location || "")}</p>
            ${event.address ? `<p>${escapeHtml(event.address)}</p>` : ""}
            <p>${escapeHtml(event.description || "")}</p>
            ${
              highlights.length
                ? `<ul class="event-highlights">${highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
                : ""
            }
          </div>
          ${
            buttonUrl
              ? `<a class="card-link" href="${escapeHtml(buttonUrl)}" rel="noopener noreferrer" target="_blank">${escapeHtml(buttonLabel)}</a>`
              : ""
          }
        </article>
      `;
    })
    .join("");
};

const renderPhotos = (photos) => {
  const target = document.querySelector("#photos-list");
  if (!target) return;
  if (!photos.length) {
    target.innerHTML = `<p class="empty">No photos have been published yet.</p>`;
    return;
  }

  target.innerHTML = photos
    .map((photo) => {
      const src = directusFileUrl(photo.image);
      return `
        <figure class="photo-card">
          ${
            src
              ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(photo.title || "Shared photo of Reign")}">`
              : ""
          }
          <figcaption class="photo-caption">
            <strong>${escapeHtml(photo.title || "Shared photo")}</strong>
            <span>${escapeHtml(photo.caption || "")}</span>
          </figcaption>
        </figure>
      `;
    })
    .join("");
};

const renderSupport = (links) => {
  const target = document.querySelector("#support-list");
  if (!target) return;
  if (!links.length) {
    target.innerHTML = `<p class="empty">No support links have been published yet.</p>`;
    return;
  }

  target.innerHTML = links
    .map((link) => {
      const isExternal = /^https?:\/\//.test(link.url || "");
      return `
        <article class="card">
          <div>
            <h3>${escapeHtml(link.title)}</h3>
            <p>${escapeHtml(link.description || "")}</p>
          </div>
          <a class="card-link" href="${escapeHtml(link.url)}"${isExternal ? ' rel="noopener noreferrer" target="_blank"' : ""}>
            ${escapeHtml(link.button_label || "Give support")}
          </a>
        </article>
      `;
    })
    .join("");
};

const renderStories = (stories) => {
  const target = document.querySelector("#stories-list");
  if (!target) return;
  if (!stories.length) {
    target.innerHTML = `<p class="empty">Approved stories will appear here.</p>`;
    return;
  }

  target.innerHTML = stories
    .map(
      (story) => `
        <article class="story-card">
          <blockquote>${escapeHtml(story.message)}</blockquote>
          <p>${escapeHtml(story.name)}${story.relationship ? ` · ${escapeHtml(story.relationship)}` : ""}</p>
        </article>
      `,
    )
    .join("");
};

const submitStory = async (form) => {
  const status = document.querySelector("#form-status");
  if (!status) return;
  const data = new FormData(form);

  if (data.get("website")) return;

  if (!cmsUrl && !storySubmitEndpoint) {
    status.textContent = "The story form will turn on once the CMS is connected.";
    return;
  }

  const payload = {
    name: String(data.get("name") || "").trim(),
    relationship: String(data.get("relationship") || "").trim(),
    message: String(data.get("message") || "").trim(),
  };

  if (!payload.name || !payload.message) {
    status.textContent = "Please add your name and note before submitting.";
    return;
  }

  const turnstileToken = turnstileState.token || String(data.get("cf-turnstile-response") || "");

  if (turnstileState.configured && !turnstileToken) {
    status.textContent = "Please complete the spam check before submitting.";
    return;
  }

  if (turnstileState.configured && !storySubmitEndpoint) {
    status.textContent = "Spam protection needs the verified story endpoint before submissions can be enabled.";
    return;
  }

  status.textContent = "Sending...";

  try {
    const response = await fetch(storySubmitEndpoint || `${cmsUrl}/items/remembrance_notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        "cf-turnstile-response": turnstileToken,
      }),
    });

    if (!response.ok) throw new Error("Story submission failed");

    form.reset();
    status.textContent = "Thank you. Your note was sent for review.";
  } catch (error) {
    console.warn(error);
    status.textContent = "Something did not go through. Please try again in a minute.";
  } finally {
    if (turnstileState.configured) resetTurnstile();
  }
};

const init = async () => {
  const needsEvents = Boolean(document.querySelector("#events-list"));
  const needsPhotos = Boolean(document.querySelector("#photos-list"));
  const needsSupport = Boolean(document.querySelector("#support-list"));
  const needsStories = Boolean(document.querySelector("#stories-list") || document.querySelector("#story-form"));

  const [events, photos, supportLinks, stories] = await Promise.all([
    needsEvents ? fetchItems("events", "?filter[is_published][_eq]=true&sort=event_date") : Promise.resolve([]),
    needsPhotos ? fetchItems("photos", "?filter[is_published][_eq]=true&sort=sort,-taken_date&fields=*,image.*") : Promise.resolve([]),
    needsSupport ? fetchItems("donation_links", "?filter[is_published][_eq]=true&sort=sort") : Promise.resolve([]),
    needsStories
      ? fetchItems(
          "remembrance_notes",
          "?filter[is_approved][_eq]=true&filter[display_on_site][_eq]=true&sort=-created_at",
        )
      : Promise.resolve([]),
  ]);

  renderEvents(events);
  renderPhotos(photos);
  renderSupport(supportLinks);
  renderStories(stories);
  initTurnstile();

  const storyForm = document.querySelector("#story-form");
  if (storyForm) {
    storyForm.addEventListener("submit", (event) => {
      event.preventDefault();
      submitStory(event.currentTarget);
    });
  }
};

init();
