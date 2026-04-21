const { randomUUID } = require("node:crypto");

const LIGHTFIELD_ENDPOINT = "https://api.lightfield.app/v1/contacts";
const LIGHTFIELD_VERSION = "2026-03-01";
const SITE_ORIGIN = "https://phidea.eu";

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.statusCode = 405;
    res.end("Method Not Allowed");
    return;
  }

  const apiKey = process.env.LIGHTFIELD_API_KEY;
  if (!apiKey) {
    console.error("LIGHTFIELD_API_KEY not set");
    return redirect(res, `${SITE_ORIGIN}/oops.html`);
  }

  const body = req.body || {};
  const email = String(body.email || "").trim().toLowerCase();
  const carrier = String(body.carrier || "").trim();
  const lob = String(body.lob || "").trim();
  const variant = String(body.variant || "").trim();

  const noteLines = [
    carrier && `Company: ${carrier}`,
    lob && `Line of business: ${lob}`,
    variant && `Source variant: ${variant}`,
    `Submitted: ${new Date().toISOString()}`,
    req.headers["user-agent"] && `User-agent: ${req.headers["user-agent"]}`,
  ].filter(Boolean);

  const fields = { $notes: noteLines.join("\n") };
  if (email) fields.$email = [email];
  if (carrier) fields.$title = carrier;

  try {
    const response = await fetch(LIGHTFIELD_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Lightfield-Version": LIGHTFIELD_VERSION,
        "Content-Type": "application/json",
        "Idempotency-Key": randomUUID(),
      },
      body: JSON.stringify({ fields }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Lightfield error", response.status, text);
      return redirect(res, withVariant(`${SITE_ORIGIN}/oops.html`, variant));
    }
  } catch (err) {
    console.error("Lightfield request failed", err);
    return redirect(res, withVariant(`${SITE_ORIGIN}/oops.html`, variant));
  }

  return redirect(res, withVariant(`${SITE_ORIGIN}/merci.html`, variant));
};

function withVariant(url, variant) {
  return variant ? `${url}?v=${encodeURIComponent(variant)}` : url;
}

function redirect(res, url) {
  res.statusCode = 303;
  res.setHeader("Location", url);
  res.end("");
}
