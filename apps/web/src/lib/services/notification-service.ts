import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { ContactInfo } from "@ogp/types";
import {
  normalizeWhatsAppRecipientDigits,
  sendMetaWhatsAppTextMessage,
} from "@/lib/services/whatsapp-cloud-api";

/**
 * Notification service for sending emails and WhatsApp messages
 * Uses AWS SES for emails and Meta WhatsApp Cloud API for WhatsApp
 */

// SES is regional — must match where identities are verified (e.g. af-south-1 for this deployment).
const sesRegion =
  process.env.SES_REGION || process.env.AWS_REGION || "us-east-1";

const sesClient = new SESClient({
  region: sesRegion,
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined,
});

/**
 * Email template for incident notification
 */
function getEmailTemplate(
  incidentTitle: string,
  incidentDescription: string,
  incidentId: string,
  categoryName: string,
  incidentUrl: string
): { subject: string; htmlBody: string; textBody: string } {
  const subject = `Nova Ocorrência Triada - ${categoryName}`;
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .info { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .label { font-weight: bold; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Nova Ocorrência Triada</h1>
        </div>
        <div class="content">
          <p>Prezado(a) Responsável,</p>
          <p>Uma nova ocorrência foi triada e requer atenção da vereação <strong>${categoryName}</strong>.</p>
          
          <div class="info">
            <p><span class="label">Título:</span> ${incidentTitle}</p>
            <p><span class="label">Descrição:</span> ${incidentDescription || "Sem descrição"}</p>
            <p><span class="label">ID da Ocorrência:</span> ${incidentId}</p>
            <p><span class="label">Vereação:</span> ${categoryName}</p>
          </div>
          
          <p>Por favor, acesse a plataforma para visualizar os detalhes completos e tomar as ações necessárias.</p>
          
          <a href="${incidentUrl}" class="button">Ver Ocorrência</a>
          
          <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">
            Esta é uma notificação automática do Sistema de Gestão de Ocorrências da Câmara Municipal de Beira.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const textBody = `
Nova Ocorrência Triada - ${categoryName}

Prezado(a) Responsável,

Uma nova ocorrência foi triada e requer atenção da vereação ${categoryName}.

Título: ${incidentTitle}
Descrição: ${incidentDescription || "Sem descrição"}
ID da Ocorrência: ${incidentId}
Vereação: ${categoryName}

Por favor, acesse a plataforma para visualizar os detalhes completos e tomar as ações necessárias.

Acesse: ${incidentUrl}

Esta é uma notificação automática do Sistema de Gestão de Ocorrências da Câmara Municipal de Beira.
  `;
  
  return { subject, htmlBody, textBody };
}

/**
 * WhatsApp message template for incident notification
 */
function getWhatsAppMessage(
  incidentTitle: string,
  incidentDescription: string,
  incidentId: string,
  categoryName: string,
  incidentUrl: string
): string {
  return `🚨 *Nova Ocorrência Triada*

*Vereação:* ${categoryName}

*Título:* ${incidentTitle}
${incidentDescription ? `*Descrição:* ${incidentDescription}` : ""}

*ID:* ${incidentId}

Por favor, acesse a plataforma para visualizar os detalhes completos.

${incidentUrl}

---
Sistema de Gestão de Ocorrências
Câmara Municipal de Beira`;
}

/**
 * Send email notification using AWS SES
 */
export async function sendEmailNotification(
  to: string,
  incidentTitle: string,
  incidentDescription: string,
  incidentId: string,
  categoryName: string,
  incidentUrl: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Do not invent a From address — it must be a verified SES identity in `sesRegion`.
    const fromEmail =
      process.env.SES_FROM_EMAIL || process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "";

    if (!fromEmail) {
      console.warn("SES_FROM_EMAIL (or NEXT_PUBLIC_SUPPORT_EMAIL) not set. Skipping email.");
      return {
        success: false,
        error:
          "AWS SES not configured: set SSM /ogp/prod/ses/from_email to a verified sender, then deploy.",
      };
    }

    const { subject, htmlBody, textBody } = getEmailTemplate(
      incidentTitle,
      incidentDescription,
      incidentId,
      categoryName,
      incidentUrl
    );

    const command = new SendEmailCommand({
      Source: fromEmail,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: "UTF-8",
          },
          Text: {
            Data: textBody,
            Charset: "UTF-8",
          },
        },
      },
    });

    const response = await sesClient.send(command);
    
    return {
      success: true,
      messageId: response.MessageId,
    };
  } catch (error: any) {
    console.error("Error sending email notification:", error);
    return {
      success: false,
      error: error.message || "Failed to send email",
    };
  }
}

/**
 * Send WhatsApp text via Meta WhatsApp Cloud API (Graph).
 */
export async function sendWhatsAppNotification(
  to: string,
  incidentTitle: string,
  incidentDescription: string,
  incidentId: string,
  categoryName: string,
  incidentUrl: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const toDigits = normalizeWhatsAppRecipientDigits(to);
    const message = getWhatsAppMessage(
      incidentTitle,
      incidentDescription,
      incidentId,
      categoryName,
      incidentUrl
    );

    const result = await sendMetaWhatsAppTextMessage(toDigits, message);

    if (result.ok) {
      return { success: true, messageId: result.messageId };
    }

    const detail =
      result.graphCode != null
        ? `${result.error} (code=${result.graphCode}${result.graphSubcode != null ? ` subcode=${result.graphSubcode}` : ""})`
        : result.error;
    console.error("Error sending WhatsApp notification:", { status: result.status, error: detail });
    return {
      success: false,
      error: detail,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send WhatsApp message";
    console.error("Error sending WhatsApp notification:", message);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Send notifications to a contact (email and WhatsApp)
 */
export async function notifyContact(
  contact: ContactInfo,
  incidentTitle: string,
  incidentDescription: string,
  incidentId: string,
  categoryName: string,
  incidentUrl: string
): Promise<{
  email: { success: boolean; messageId?: string; error?: string };
  whatsapp: { success: boolean; messageId?: string; error?: string };
}> {
  const results = {
    email: { success: false, error: "No email provided" },
    whatsapp: { success: false, error: "No phone number provided" },
  };

  // Send email if email is provided
  if (contact.email) {
    results.email = await sendEmailNotification(
      contact.email,
      incidentTitle,
      incidentDescription,
      incidentId,
      categoryName,
      incidentUrl
    );
  }

  // Send WhatsApp if phone number is provided
  if (contact.phone) {
    results.whatsapp = await sendWhatsAppNotification(
      contact.phone,
      incidentTitle,
      incidentDescription,
      incidentId,
      categoryName,
      incidentUrl
    );
  }

  return results;
}

/**
 * Strip formatting only; do not add a country code. Store full international numbers in admin
 * (e.g. +14155551234 or +25884xxxxxxx) — digits after stripping must be valid E.164 without the leading +.
 */
export function normalizePhoneNumber(phone: string): string {
  return phone.trim().replace(/\D/g, "");
}
