import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomUUID } from "node:crypto";

const LIGHTFIELD_ENDPOINT = "https://api.lightfield.app/v1/contacts";
const LIGHTFIELD_VERSION = "2026-03-01";
const SITE_ORIGIN = "https://phidea.eu";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).send("Method Not Allowed");
  }

  const apiKey = process.env.LIGHTFIELD_API_KEY;
  if (!apiKey) {
    console.error("LIGHTFIELD_API_KEY not set");
    return redirect(res, `${SITE_ORIGIN}/oops.html`);
  }

  const body = (req.body ?? {}) as Record<string, string>;
  const email = (body.email ?? "").trim().toLowerCase();
  const carrier = (body.carrier ?? "").trim();
  const lob = (body.lob ?? "").trim();
  const variant = (body.variant ?? "").trim();

  const noteLines = [
    carrier && `Company: ${carrier}`,
    lob && `Line of business: ${lob}`,
    variant && `Source variant: ${variant}`,
    `Submitted: ${new Date().toISOString()}`,
    req.headers["user-agent"] && `User-agent: ${req.headers["user-agent"]}`,
  ].filter(Boolean);

  const fields: Record<string, unknown> = { $notes: noteLines.join("\n") };
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
      return redirect(res, `${SITE_ORIGIN}/oops.html`);
    }
  } catch (err) {
    console.error("Lightfield request failed", err);
    return redirect(res, `${SITE_ORIGIN}/oops.html`);
  }

  return redirect(res, `${SITE_ORIGIN}/merci.html`);
}

function redirect(res: VercelResponse, url: string) {
  res.setHeader("Location", url);
  return res.status(303).send("");
}
