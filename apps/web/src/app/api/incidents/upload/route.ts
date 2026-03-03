import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireAuth } from "@/lib/auth/rbac";
import { writeFile, mkdir } from "fs/promises";
import { join, sep } from "path";
import { existsSync } from "fs";

// Allowed image MIME types
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * POST /api/incidents/upload
 * Upload an image for an incident
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: { message: "Nenhum ficheiro fornecido" } },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: {
            message:
              "Tipo de ficheiro não permitido. Apenas imagens (JPG, PNG, WEBP, GIF) são aceites.",
          },
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: {
            message: `Ficheiro muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          },
        },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split(".").pop() || "jpg";
    const filename = `incident-${timestamp}-${randomString}.${fileExtension}`;

    // Create uploads directory if it doesn't exist.
    // Resolve the app root based on __dirname so it works with .next/server or .next/standalone.
    const appsWebSegment = `${sep}apps${sep}web`;
    const baseDir = __dirname;
    const idx = baseDir.lastIndexOf(appsWebSegment);
    const appRoot = idx !== -1 ? baseDir.slice(0, idx + appsWebSegment.length) : process.cwd();
    const uploadsDir = join(appRoot, "public", "uploads", "incidents");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filepath = join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    // Construct deployment-agnostic URL (relative to current origin)
    // This avoids hardcoding hostnames/IPs so any deployment works automatically.
    const publicUrl = `/uploads/incidents/${filename}`;

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl,
        type: "IMAGE",
        filename: filename,
        size: file.size,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: { message: "Erro ao fazer upload da imagem. Tente novamente." } },
      { status: 500 }
    );
  }
}
