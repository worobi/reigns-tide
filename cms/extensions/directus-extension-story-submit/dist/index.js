const expectedAction = "story";

const cleanText = (value, maxLength) => {
  const text = String(value || "").trim();
  return text.length > maxLength ? text.slice(0, maxLength) : text;
};

const firstHeaderValue = (value) => {
  const header = Array.isArray(value) ? value[0] : value;
  return String(header || "").split(",")[0].trim();
};

export default {
  id: "story-submit",
  handler: (router, { env, services, getSchema }) => {
    const { ItemsService } = services;

    router.post("/", async (req, res) => {
      const expectedHostnames = new Set(
        String(env.TURNSTILE_HOSTNAMES || "")
          .split(",")
          .map((hostname) => hostname.trim())
          .filter(Boolean),
      );
      const token = req.body?.["cf-turnstile-response"];

      if (
        !env.TURNSTILE_SECRET ||
        typeof token !== "string" ||
        token.length === 0 ||
        token.length > 2048 ||
        expectedHostnames.size === 0
      ) {
        return res.status(403).json({ error: "forbidden" });
      }

      const remoteip =
        firstHeaderValue(req.headers["cf-connecting-ip"]) ||
        firstHeaderValue(req.headers["x-forwarded-for"]) ||
        req.ip ||
        "";

      let verification;

      try {
        const verifyResponse = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          signal: AbortSignal.timeout(10000),
          body: new URLSearchParams({
            secret: env.TURNSTILE_SECRET,
            response: token,
            remoteip,
          }),
        });

        if (!verifyResponse.ok) throw new Error(`siteverify ${verifyResponse.status}`);
        verification = await verifyResponse.json();
      } catch (error) {
        return res.status(403).json({ error: "forbidden" });
      }

      if (
        !verification.success ||
        verification.action !== expectedAction ||
        !expectedHostnames.has(verification.hostname)
      ) {
        return res.status(403).json({ error: "forbidden" });
      }

      const payload = {
        name: cleanText(req.body?.name, 100),
        relationship: cleanText(req.body?.relationship, 120),
        message: cleanText(req.body?.message, 2000),
        is_approved: false,
        display_on_site: true,
      };

      if (!payload.name || !payload.message) {
        return res.status(400).json({ error: "Name and message are required." });
      }

      try {
        const notesService = new ItemsService("remembrance_notes", {
          schema: await getSchema(),
        });

        await notesService.createOne(payload);
        return res.status(202).json({ ok: true });
      } catch (error) {
        return res.status(500).json({ error: "Story submission failed." });
      }
    });
  },
};
