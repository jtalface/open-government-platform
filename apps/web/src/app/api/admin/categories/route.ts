import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireAdmin } from "@/lib/auth/rbac";
import { successResponse, handleApiError } from "@/lib/api/error-handler";
import { prisma } from "@ogp/database";
import { z } from "zod";

const CreateCategorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  slug: z.string().min(1, "Slug é obrigatório"),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Cor deve ser um código hexadecimal válido").optional(),
  sortOrder: z.number().int().min(0).optional(),
});

/**
 * GET /api/admin/categories
 * List all categories (including inactive) for admin
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAdmin(session);

    const categories = await prisma.category.findMany({
      where: {
        municipalityId: session!.user.municipalityId,
      },
      orderBy: [
        { sortOrder: "asc" },
        { name: "asc" },
      ],
    });

    return successResponse(categories);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/admin/categories
 * Create a new category
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAdmin(session);

    const body = await request.json();
    const input = CreateCategorySchema.parse(body);

    // Check if slug already exists
    const existingCategory = await prisma.category.findFirst({
      where: {
        municipalityId: session!.user.municipalityId,
        slug: input.slug,
      },
    });

    if (existingCategory) {
      return Response.json(
        { error: { message: "Slug já está em uso" } },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        municipalityId: session!.user.municipalityId,
        name: input.name,
        slug: input.slug,
        description: input.description,
        icon: input.icon || "📂",
        color: input.color || "#6B7280",
        sortOrder: input.sortOrder ?? 0,
        active: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        municipalityId: session!.user.municipalityId,
        actorUserId: session!.user.id,
        entityType: "Category",
        entityId: category.id,
        action: "CREATE",
        metadata: {
          categoryName: category.name,
          categorySlug: category.slug,
        },
      },
    });

    return successResponse(category, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

