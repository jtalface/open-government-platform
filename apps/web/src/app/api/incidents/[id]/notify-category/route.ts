import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { handleApiError } from "@/lib/api/error-handler";
import { prisma } from "@ogp/database";
import { notifyContact, normalizePhoneNumber } from "@/lib/services/notification-service";
import { ContactInfo } from "@ogp/types";

/**
 * POST /api/incidents/:id/notify-category
 * Notify the category (vereação) about a triaged incident
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is manager or admin
    if (session.user.role !== "MANAGER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const incident = await prisma.incidentEvent.findUnique({
      where: {
        id: params.id,
        municipalityId: session!.user.municipalityId,
      },
      include: {
        category: true,
      },
    });

    if (!incident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    // Verify incident is not in OPEN status
    if (incident.status === "OPEN") {
      return NextResponse.json(
        { error: "Incident must not be in OPEN status to notify category" },
        { status: 400 }
      );
    }

    // Get the responsavel contact info from category
    const category = incident.category;
    let responsavel: ContactInfo | null = null;
    
    if (category.responsavel) {
      try {
        // responsavel is stored as JSON in the database
        responsavel = typeof category.responsavel === "string" 
          ? JSON.parse(category.responsavel) 
          : category.responsavel as ContactInfo;
      } catch (error) {
        console.error("Error parsing responsavel contact info:", error);
      }
    }

    // Build incident URL
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:4000";
    const incidentUrl = `${baseUrl}/dashboard/incidents/${incident.id}`;

    // Send notifications to responsavel if available
    const notificationResults: {
      email?: { success: boolean; messageId?: string; error?: string };
      whatsapp?: { success: boolean; messageId?: string; error?: string };
    } = {};

    if (responsavel && (responsavel.email || responsavel.phone)) {
      // Normalize phone number for WhatsApp if provided
      const normalizedPhone = responsavel.phone 
        ? normalizePhoneNumber(responsavel.phone, "258") // Mozambique country code
        : undefined;
      
      const contactToNotify: ContactInfo = {
        name: responsavel.name,
        email: responsavel.email || "",
        phone: normalizedPhone || "",
      };

      const results = await notifyContact(
        contactToNotify,
        incident.title,
        incident.description || "",
        incident.id,
        category.name,
        incidentUrl
      );

      notificationResults.email = results.email;
      notificationResults.whatsapp = results.whatsapp;
    }

    // Log the notification in audit log
    await prisma.auditLog.create({
      data: {
        municipalityId: session.user.municipalityId,
        actorUserId: session.user.id,
        entityType: "IncidentEvent",
        entityId: incident.id,
        action: "INCIDENT_CATEGORY_NOTIFIED",
        metadata: {
          incidentTitle: incident.title,
          categoryId: incident.categoryId,
          categoryName: category.name,
          notificationsSent: notificationResults,
          responsavelContact: responsavel ? {
            name: responsavel.name,
            email: responsavel.email,
            phone: responsavel.phone ? "***" : undefined, // Don't log full phone number
          } : null,
        },
      },
    });

    // Determine success message
    const emailSuccess = notificationResults.email?.success;
    const whatsappSuccess = notificationResults.whatsapp?.success;
    
    let message = "Category notified successfully";
    if (!responsavel) {
      message = "Category notified (no responsavel contact configured)";
    } else if (emailSuccess && whatsappSuccess) {
      message = "Email and WhatsApp notifications sent successfully";
    } else if (emailSuccess) {
      message = "Email notification sent successfully" + (notificationResults.whatsapp?.error ? ` (WhatsApp: ${notificationResults.whatsapp.error})` : "");
    } else if (whatsappSuccess) {
      message = "WhatsApp notification sent successfully" + (notificationResults.email?.error ? ` (Email: ${notificationResults.email.error})` : "");
    } else if (responsavel.email || responsavel.phone) {
      message = "Notification attempted but failed" + 
        (notificationResults.email?.error ? ` (Email: ${notificationResults.email.error})` : "") +
        (notificationResults.whatsapp?.error ? ` (WhatsApp: ${notificationResults.whatsapp.error})` : "");
    }

    return NextResponse.json({
      success: true,
      message,
      notifications: notificationResults,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
