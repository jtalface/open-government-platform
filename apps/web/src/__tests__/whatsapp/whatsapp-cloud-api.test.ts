import { createHmac } from "crypto";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  buildTextMessagePayload,
  buildTemplateMessagePayload,
  normalizeWhatsAppRecipientDigits,
  parseWhatsAppWebhookPayload,
  verifyMetaWebhookSignature,
  verifyWebhookChallenge,
  computeAppSecretProof,
  sendMetaWhatsAppTextMessage,
} from "@/lib/services/whatsapp-cloud-api";

describe("normalizeWhatsAppRecipientDigits", () => {
  it("strips whatsapp: prefix and non-digits", () => {
    expect(normalizeWhatsAppRecipientDigits("whatsapp:+14155552671")).toBe("14155552671");
  });

  it("accepts plain E.164 digits", () => {
    expect(normalizeWhatsAppRecipientDigits("+258 84 123 4567")).toBe("258841234567");
  });
});

describe("buildTextMessagePayload", () => {
  it("builds Cloud API text body", () => {
    const p = buildTextMessagePayload("258841234567", "Hello");
    expect(p).toMatchObject({
      messaging_product: "whatsapp",
      to: "258841234567",
      type: "text",
      text: { body: "Hello", preview_url: false },
    });
  });
});

describe("buildTemplateMessagePayload", () => {
  it("builds template payload with language", () => {
    const p = buildTemplateMessagePayload("258841234567", "hello_world", "en_US");
    expect(p.type).toBe("template");
    expect(p.template).toEqual({
      name: "hello_world",
      language: { code: "en_US" },
    });
  });
});

describe("verifyWebhookChallenge", () => {
  it("accepts valid subscribe + token + challenge", () => {
    const r = verifyWebhookChallenge("subscribe", "mytoken", "123456", "mytoken");
    expect(r).toEqual({ ok: true, challenge: "123456" });
  });

  it("rejects wrong token", () => {
    const r = verifyWebhookChallenge("subscribe", "wrong", "123", "mytoken");
    expect(r.ok).toBe(false);
  });
});

describe("verifyMetaWebhookSignature", () => {
  it("validates sha256 signature", () => {
    const raw = '{"test":true}';
    const secret = "my_app_secret";
    const expected = "sha256=" + createHmac("sha256", secret).update(raw, "utf8").digest("hex");
    expect(verifyMetaWebhookSignature(raw, expected, secret)).toBe(true);
    expect(verifyMetaWebhookSignature(raw, "sha256=deadbeef", secret)).toBe(false);
  });
});

describe("parseWhatsAppWebhookPayload", () => {
  it("parses inbound text message", () => {
    const body = {
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  {
                    id: "wamid.ABC",
                    from: "258841234567",
                    timestamp: "1234567890",
                    type: "text",
                    text: { body: "Hi" },
                  },
                ],
              },
            },
          ],
        },
      ],
    };
    const { inbound, statuses } = parseWhatsAppWebhookPayload(body);
    expect(inbound).toHaveLength(1);
    expect(inbound[0]).toMatchObject({
      messageId: "wamid.ABC",
      fromWaId: "258841234567",
      textBody: "Hi",
    });
    expect(statuses).toHaveLength(0);
  });

  it("parses status updates", () => {
    const body = {
      entry: [
        {
          changes: [
            {
              value: {
                statuses: [
                  {
                    id: "wamid.XYZ",
                    status: "delivered",
                    recipient_id: "258841234567",
                  },
                ],
              },
            },
          ],
        },
      ],
    };
    const { inbound, statuses } = parseWhatsAppWebhookPayload(body);
    expect(inbound).toHaveLength(0);
    expect(statuses).toHaveLength(1);
    expect(statuses[0]).toMatchObject({
      messageId: "wamid.XYZ",
      status: "delivered",
      recipientId: "258841234567",
    });
  });
});

describe("computeAppSecretProof", () => {
  it("is deterministic for same inputs", () => {
    const a = computeAppSecretProof("token123", "secret");
    const b = computeAppSecretProof("token123", "secret");
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("sendMetaWhatsAppTextMessage", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    process.env = { ...originalEnv };
    process.env.WHATSAPP_ACCESS_TOKEN = "test-token";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "123456789";
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  it("maps Graph success to ok result", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messages: [{ id: "wamid.ok" }] }),
    } as Response);

    const r = await sendMetaWhatsAppTextMessage("258841234567", "body");
    expect(r).toEqual({ ok: true, messageId: "wamid.ok" });
    expect(fetch).toHaveBeenCalledTimes(1);
    const call = vi.mocked(fetch).mock.calls[0];
    expect(call[0]).toContain("/123456789/messages");
    const init = call[1] as RequestInit | undefined;
    const headers = init?.headers as Headers | Record<string, string> | undefined;
    const auth =
      headers instanceof Headers
        ? headers.get("Authorization")
        : headers && typeof (headers as Record<string, string>).Authorization === "string"
          ? (headers as Record<string, string>).Authorization
          : undefined;
    expect(auth).toBe("Bearer test-token");
  });

  it("maps Graph error JSON", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        error: { message: "Invalid", code: 100, error_subcode: 33 },
      }),
    } as Response);

    const r = await sendMetaWhatsAppTextMessage("258841234567", "body");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.status).toBe(400);
      expect(r.error).toContain("Invalid");
      expect(r.graphCode).toBe(100);
      expect(r.graphSubcode).toBe(33);
    }
  });

  it("fails when env missing", async () => {
    delete process.env.WHATSAPP_ACCESS_TOKEN;
    const r = await sendMetaWhatsAppTextMessage("258841234567", "body");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toContain("WHATSAPP_ACCESS_TOKEN");
    }
    expect(fetch).not.toHaveBeenCalled();
  });
});
