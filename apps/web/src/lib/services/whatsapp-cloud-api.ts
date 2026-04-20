import { createHmac, timingSafeEqual } from "crypto";

/**
 * Meta WhatsApp Cloud API (Graph) — send + webhook helpers.
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

const DEFAULT_API_VERSION = "v21.0";

export function getWhatsAppGraphBaseUrl(): string {
  const version = process.env.WHATSAPP_API_VERSION?.trim() || DEFAULT_API_VERSION;
  return `https://graph.facebook.com/${version}`;
}

/**
 * Recipient for Cloud API `to` field: digits only, country code + national number, no "+" prefix.
 * Accepts legacy `whatsapp:+E164` or plain E.164 / digit strings.
 */
export function normalizeWhatsAppRecipientDigits(to: string): string {
  const t = to.trim();
  const withoutPrefix = t.toLowerCase().startsWith("whatsapp:")
    ? t.slice("whatsapp:".length).trim()
    : t;
  const digits = withoutPrefix.replace(/\D/g, "");
  return digits;
}

export type MetaTextMessagePayload = {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  type: "text";
  text: { preview_url: boolean; body: string };
};

export function buildTextMessagePayload(toDigits: string, body: string): MetaTextMessagePayload {
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: toDigits,
    type: "text",
    text: { preview_url: false, body },
  };
}

export type MetaTemplateMessagePayload = {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  type: "template";
  template: {
    name: string;
    language: { code: string };
    components?: unknown[];
  };
};

export function buildTemplateMessagePayload(
  toDigits: string,
  templateName: string,
  languageCode: string,
  components?: unknown[]
): MetaTemplateMessagePayload {
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: toDigits,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(components && components.length > 0 ? { components } : {}),
    },
  };
}

/** HMAC-SHA256(access_token, app_secret) as hex — optional Graph `appsecret_proof` query param. */
export function computeAppSecretProof(accessToken: string, appSecret: string): string {
  return createHmac("sha256", appSecret).update(accessToken).digest("hex");
}

function appendQueryParams(
  url: string,
  params: Record<string, string | undefined>
): string {
  const u = new URL(url);
  for (const [k, v] of Object.entries(params)) {
    if (v) u.searchParams.set(k, v);
  }
  return u.toString();
}

export type MetaSendTextResult =
  | { ok: true; messageId: string }
  | { ok: false; status: number; error: string; graphCode?: number; graphSubcode?: number };

function formatGraphError(status: number, json: unknown): {
  message: string;
  graphCode?: number;
  graphSubcode?: number;
} {
  if (json && typeof json === "object" && "error" in json) {
    const err = (json as { error?: Record<string, unknown> }).error;
    if (err && typeof err === "object") {
      const message = typeof err.message === "string" ? err.message : JSON.stringify(err);
      const graphCode = typeof err.code === "number" ? err.code : undefined;
      const graphSubcode = typeof err.error_subcode === "number" ? err.error_subcode : undefined;
      return { message: `HTTP ${status}: ${message}`, graphCode, graphSubcode };
    }
  }
  return { message: `HTTP ${status}: Meta send failed` };
}

async function postMessages(
  accessToken: string,
  phoneNumberId: string,
  body: unknown
): Promise<MetaSendTextResult> {
  const base = getWhatsAppGraphBaseUrl();
  let url = `${base}/${phoneNumberId}/messages`;
  const appSecret = process.env.META_APP_SECRET?.trim();
  if (appSecret) {
    const proof = computeAppSecretProof(accessToken, appSecret);
    url = appendQueryParams(url, { appsecret_proof: proof });
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok) {
    const { message, graphCode, graphSubcode } = formatGraphError(res.status, json);
    return { ok: false, status: res.status, error: message, graphCode, graphSubcode };
  }

  const messages = json.messages as unknown;
  if (Array.isArray(messages) && messages[0] && typeof messages[0] === "object") {
    const id = (messages[0] as { id?: string }).id;
    if (typeof id === "string" && id.length > 0) {
      return { ok: true, messageId: id };
    }
  }

  return {
    ok: false,
    status: res.status,
    error: "Meta response missing messages[0].id",
  };
}

export async function sendMetaWhatsAppTextMessage(
  toDigits: string,
  textBody: string
): Promise<MetaSendTextResult> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();

  if (!accessToken || !phoneNumberId) {
    return {
      ok: false,
      status: 0,
      error:
        "WhatsApp Cloud API not configured: set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID",
    };
  }

  if (!toDigits) {
    return { ok: false, status: 0, error: "Invalid recipient: empty phone number" };
  }

  const payload = buildTextMessagePayload(toDigits, textBody);
  return postMessages(accessToken, phoneNumberId, payload);
}

export async function sendMetaWhatsAppTemplateMessage(
  toDigits: string,
  templateName: string,
  languageCode: string,
  components?: unknown[]
): Promise<MetaSendTextResult> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();

  if (!accessToken || !phoneNumberId) {
    return {
      ok: false,
      status: 0,
      error:
        "WhatsApp Cloud API not configured: set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID",
    };
  }

  if (!toDigits) {
    return { ok: false, status: 0, error: "Invalid recipient: empty phone number" };
  }

  const payload = buildTemplateMessagePayload(toDigits, templateName, languageCode, components);
  return postMessages(accessToken, phoneNumberId, payload);
}

/** Webhook subscription verification (GET). */
export function verifyWebhookChallenge(
  mode: string | null,
  token: string | null,
  challenge: string | null,
  verifyToken: string
): { ok: true; challenge: string } | { ok: false; reason: string } {
  if (mode !== "subscribe") {
    return { ok: false, reason: "hub.mode must be subscribe" };
  }
  if (!token || !challenge) {
    return { ok: false, reason: "missing hub.verify_token or hub.challenge" };
  }
  if (token !== verifyToken) {
    return { ok: false, reason: "verify_token mismatch" };
  }
  return { ok: true, challenge };
}

/**
 * Validates `X-Hub-Signature-256` (sha256=<hex>) against raw body.
 * Uses timing-safe compare when lengths match.
 */
export function verifyMetaWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string
): boolean {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }
  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  const received = signatureHeader.slice("sha256=".length);
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(received, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export type ParsedInboundWhatsAppMessage = {
  messageId: string;
  fromWaId: string;
  timestampUnix?: string;
  textBody?: string;
};

export type ParsedWhatsAppStatusUpdate = {
  messageId: string;
  status: string;
  recipientId?: string;
  errors?: Array<{ code?: number; title?: string }>;
};

export type ParsedWebhookBatch = {
  inbound: ParsedInboundWhatsAppMessage[];
  statuses: ParsedWhatsAppStatusUpdate[];
};

/**
 * Defensive parse of Meta `whatsapp_business_account` notification entries.
 */
export function parseWhatsAppWebhookPayload(body: unknown): ParsedWebhookBatch {
  const inbound: ParsedInboundWhatsAppMessage[] = [];
  const statuses: ParsedWhatsAppStatusUpdate[] = [];

  if (!body || typeof body !== "object") {
    return { inbound, statuses };
  }

  const entry = (body as { entry?: unknown }).entry;
  if (!Array.isArray(entry)) {
    return { inbound, statuses };
  }

  for (const ent of entry) {
    if (!ent || typeof ent !== "object") continue;
    const changes = (ent as { changes?: unknown }).changes;
    if (!Array.isArray(changes)) continue;

    for (const ch of changes) {
      if (!ch || typeof ch !== "object") continue;
      const value = (ch as { value?: unknown }).value;
      if (!value || typeof value !== "object") continue;

      const messages = (value as { messages?: unknown }).messages;
      if (Array.isArray(messages)) {
        for (const m of messages) {
          if (!m || typeof m !== "object") continue;
          const id = (m as { id?: string }).id;
          const from = (m as { from?: string }).from;
          const ts = (m as { timestamp?: string }).timestamp;
          const textObj = (m as { text?: { body?: string } }).text;
          const textBody =
            textObj && typeof textObj.body === "string" ? textObj.body : undefined;
          if (typeof id === "string" && typeof from === "string") {
            inbound.push({
              messageId: id,
              fromWaId: from,
              timestampUnix: typeof ts === "string" ? ts : undefined,
              textBody,
            });
          }
        }
      }

      const statusList = (value as { statuses?: unknown }).statuses;
      if (Array.isArray(statusList)) {
        for (const s of statusList) {
          if (!s || typeof s !== "object") continue;
          const id = (s as { id?: string }).id;
          const status = (s as { status?: string }).status;
          const recipientId = (s as { recipient_id?: string }).recipient_id;
          const errors = (s as { errors?: unknown }).errors;
          if (typeof id === "string" && typeof status === "string") {
            const mappedErrors = Array.isArray(errors)
              ? errors
                  .filter((e) => e && typeof e === "object")
                  .map((e) => ({
                    code: typeof (e as { code?: number }).code === "number" ? (e as { code: number }).code : undefined,
                    title:
                      typeof (e as { title?: string }).title === "string"
                        ? (e as { title: string }).title
                        : undefined,
                  }))
              : undefined;
            statuses.push({
              messageId: id,
              status,
              recipientId: typeof recipientId === "string" ? recipientId : undefined,
              errors: mappedErrors,
            });
          }
        }
      }
    }
  }

  return { inbound, statuses };
}
