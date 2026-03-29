import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireAdmin } from "@/lib/auth/rbac";
import { successResponse, handleApiError } from "@/lib/api/error-handler";
import { prisma } from "@ogp/database";
import { z } from "zod";

const ContactInfoSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  email: z.string().email("Email inválido"),
});

const UpdateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Cor deve ser um código hexadecimal válido").optional(),
  vereador: ContactInfoSchema.optional(),
  administrador: ContactInfoSchema.nullable().optional(),
  responsavel: ContactInfoSchema.optional(),
  sortOrder: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

/**
 * PATCH /api/admin/categories/:id
 * Update category
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    requireAdmin(session);

    const body = await request.json();
    const input = UpdateCategorySchema.parse(body);

    // If slug is being updated, check for conflicts
    if (input.slug) {
      const existingCategory = await prisma.category.findFirst({
        where: {
          municipalityId: session!.user.municipalityId,
          slug: input.slug,
          id: { not: params.id },
        },
      });

      if (existingCategory) {
        return Response.json(
          { error: { message: "Slug já está em uso" } },
          { status: 400 }
        );
      }
    }

    // Convert to JSON for Prisma (null stays null, objects become JSON)
    const updateData: any = { ...input };
    if (updateData.vereador !== undefined) {
      updateData.vereador = updateData.vereador === null ? null : updateData.vereador;
    }
    if (updateData.administrador !== undefined) {
      updateData.administrador = updateData.administrador === null ? null : updateData.administrador;
    }
    if (updateData.responsavel !== undefined) {
      updateData.responsavel = updateData.responsavel === null ? null : updateData.responsavel;
    }

    const category = await prisma.category.update({
      where: {
        id: params.id,
        municipalityId: session!.user.municipalityId,
      },
      data: updateData,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        municipalityId: session!.user.municipalityId,
        actorUserId: session!.user.id,
        entityType: "Category",
        entityId: category.id,
        action: "UPDATE",
        metadata: input,
      },
    });

    return successResponse(category);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/admin/categories/:id
 * Delete a category
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    requireAdmin(session);

    // Check if category is in use
    const incidentCount = await prisma.incidentEvent.count({
      where: { categoryId: params.id, deletedAt: null },
    });

    if (incidentCount > 0) {
      return Response.json(
        {
          error: {
            message: `Não é possível eliminar esta vereação. Existem ${incidentCount} ocorrências associadas.`,
          },
        },
        { status: 400 }
      );
    }

    const category = await prisma.category.delete({
      where: {
        id: params.id,
        municipalityId: session!.user.municipalityId,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        municipalityId: session!.user.municipalityId,
        actorUserId: session!.user.id,
        entityType: "Category",
        entityId: category.id,
        action: "DELETE",
        metadata: {
          categoryName: category.name,
        },
      },
    });

    return successResponse({ message: "Category deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}

