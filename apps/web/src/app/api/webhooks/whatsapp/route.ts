import { NextRequest, NextResponse } from "next/server";
import {
  parseWhatsAppWebhookPayload,
  verifyMetaWebhookSignature,
  verifyWebhookChallenge,
} from "@/lib/services/whatsapp-cloud-api";

/**
 * Meta WhatsApp Cloud API webhooks (verification + events).
 * Configure callback URL in Meta Developer Console → WhatsApp → Configuration.
 */

export async function GET(req: NextRequest) {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN?.trim();
  if (!verifyToken) {
    return new NextResponse("WhatsApp verify token not configured", { status: 503 });
  }

  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  const result = verifyWebhookChallenge(mode, token, challenge, verifyToken);
  if (!result.ok) {
    return new NextResponse(result.reason, { status: 403 });
  }

  return new NextResponse(result.challenge, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const appSecret = process.env.META_APP_SECRET?.trim();
  const sig = req.headers.get("x-hub-signature-256");

  if (appSecret) {
    if (!sig || !verifyMetaWebhookSignature(rawBody, sig, appSecret)) {
      return new NextResponse("Invalid signature", { status: 403 });
    }
  } else {
    console.warn(
      "[whatsapp-webhook] META_APP_SECRET not set; skipping X-Hub-Signature-256 verification (not recommended in production)"
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody) as unknown;
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const parsed = parseWhatsAppWebhookPayload(body);

  if (parsed.inbound.length > 0 || parsed.statuses.length > 0) {
    console.log("[whatsapp-webhook]", {
      inboundCount: parsed.inbound.length,
      statusCount: parsed.statuses.length,
      sampleInbound: parsed.inbound[0]
        ? {
            messageId: parsed.inbound[0].messageId,
            fromWaId: parsed.inbound[0].fromWaId,
            hasText: Boolean(parsed.inbound[0].textBody),
          }
        : undefined,
      sampleStatus: parsed.statuses[0]
        ? {
            messageId: parsed.statuses[0].messageId,
            status: parsed.statuses[0].status,
          }
        : undefined,
    });
  }

  // TODO: route `parsed.inbound` / `parsed.statuses` to domain handlers (e.g. reply flows) when product requires it.

  return NextResponse.json({ success: true });
}
