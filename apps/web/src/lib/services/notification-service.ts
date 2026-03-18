import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import twilio from "twilio";
import { ContactInfo } from "@ogp/types";

/**
 * Notification service for sending emails and WhatsApp messages
 * Uses AWS SES for emails and Twilio for WhatsApp
 */

// Initialize AWS SES client
const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined,
});

// Initialize Twilio client for WhatsApp
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

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
    // Check if AWS SES is configured
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.warn("AWS SES credentials not configured. Skipping email notification.");
      return { success: false, error: "AWS SES not configured" };
    }

    const fromEmail = process.env.SES_FROM_EMAIL || process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "noreply@beira.gov.mz";
    
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
 * Send WhatsApp message using Twilio
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
    // Check if Twilio is configured
    if (!twilioClient) {
      console.warn("Twilio not configured. Skipping WhatsApp notification.");
      return { success: false, error: "Twilio not configured" };
    }

    const fromNumber = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886"; // Twilio sandbox number
    const toNumber = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
    
    const message = getWhatsAppMessage(
      incidentTitle,
      incidentDescription,
      incidentId,
      categoryName,
      incidentUrl
    );

    const twilioResponse = await twilioClient.messages.create({
      from: fromNumber,
      to: toNumber,
      body: message,
    });

    return {
      success: true,
      messageId: twilioResponse.sid,
    };
  } catch (error: any) {
    console.error("Error sending WhatsApp notification:", error);
    return {
      success: false,
      error: error.message || "Failed to send WhatsApp message",
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
 * Normalize phone number for WhatsApp (remove spaces, add country code if needed)
 */
export function normalizePhoneNumber(phone: string, defaultCountryCode: string = "258"): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, "");
  
  // If it doesn't start with country code, add it
  if (!cleaned.startsWith(defaultCountryCode)) {
    // Remove leading 0 if present (common in Mozambique)
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.substring(1);
    }
    cleaned = defaultCountryCode + cleaned;
  }
  
  return cleaned;
}
