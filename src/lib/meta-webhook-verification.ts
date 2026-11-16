import { timingSafeEqual } from "node:crypto";

export function verifyMetaWebhookRequest(
  request: Request,
  expectedToken: string | undefined,
): Response {
  if (!expectedToken) {
    return new Response(null, { status: 503 });
  }

  const params = new URL(request.url).searchParams;
  const mode = params.get("hub.mode");
  const providedToken = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (!mode || !providedToken || !challenge) {
    return new Response(null, { status: 400 });
  }

  const expected = Buffer.from(expectedToken);
  const provided = Buffer.from(providedToken);
  if (
    mode !== "subscribe" ||
    expected.length !== provided.length ||
    !timingSafeEqual(expected, provided)
  ) {
    return new Response(null, { status: 403 });
  }

  return new Response(challenge, { status: 200 });
}
