import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { stat, readFile } from "fs/promises";

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

const SAFE_FILENAME = /^[a-zA-Z0-9._-]+$/;

export async function GET(
  _req: NextRequest,
  { params }: { params: { filename: string } }
) {
  const { filename } = params;

  if (!filename || !SAFE_FILENAME.test(filename)) {
    return NextResponse.json({ error: { message: "Invalid filename" } }, { status: 400 });
  }

  const filePath = join(process.cwd(), "public", "uploads", "projects", filename);

  try {
    await stat(filePath);
    const fileBuffer = await readFile(filePath);
    const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
    const contentType = CONTENT_TYPES[ext] || "image/jpeg";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
