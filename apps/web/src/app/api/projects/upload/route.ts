import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function canUploadProjects(role: string | undefined): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

/**
 * POST /api/projects/upload
 * Image for project description or project updates (managers & admins).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    if (!canUploadProjects(session.user.role)) {
      return NextResponse.json({ error: { message: "Forbidden" } }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: { message: "Nenhum ficheiro fornecido" } }, { status: 400 });
    }

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

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split(".").pop() || "jpg";
    const filename = `project-${timestamp}-${randomString}.${fileExtension}`;

    const uploadsDir = join(process.cwd(), "public", "uploads", "projects");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filepath = join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    const publicUrl = `/api/uploads/projects/${filename}`;

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl,
        type: "IMAGE",
        filename,
        size: file.size,
      },
    });
  } catch (error) {
    console.error("Project upload error:", error);
    return NextResponse.json(
      { error: { message: "Erro ao fazer upload da imagem. Tente novamente." } },
      { status: 500 }
    );
  }
}
