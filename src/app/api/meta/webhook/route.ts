import { verifyMetaWebhookRequest } from "@/lib/meta-webhook-verification";

export function GET(request: Request): Response {
  return verifyMetaWebhookRequest(
    request,
    process.env.META_WEBHOOK_VERIFY_TOKEN,
  );
}
