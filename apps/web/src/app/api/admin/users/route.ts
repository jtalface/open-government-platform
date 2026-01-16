import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { requireAdmin } from "@/lib/auth/rbac";
import { successResponse, handleApiError } from "@/lib/api/error-handler";
import { prisma } from "@ogp/database";
import bcrypt from "bcryptjs";
import { z } from "zod";

const CreateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["CITIZEN", "MANAGER", "ADMIN"]),
  neighborhoodId: z.string().uuid().optional(),
});

/**
 * GET /api/admin/users
 * List all users with filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAdmin(session);

    const searchParams = request.nextUrl.searchParams;
    const municipalityId = session!.user.municipalityId;

    const search = searchParams.get("search");
    const role = searchParams.get("role");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const where: any = { municipalityId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          neighborhood: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    return successResponse({
      items: users,
      total,
      page,
      pageSize,
      hasMore: total > page * pageSize,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/admin/users
 * Create a new user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAdmin(session);

    const body = await request.json();
    const input = CreateUserSchema.parse(body);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      return Response.json(
        { error: { message: "Email já está em uso" } },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role,
        municipalityId: session!.user.municipalityId,
        neighborhoodId: input.neighborhoodId,
        active: true,
      },
      include: {
        neighborhood: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        municipalityId: session!.user.municipalityId,
        actorUserId: session!.user.id,
        entityType: "User",
        entityId: user.id,
        action: "CREATE",
        metadata: {
          userName: user.name,
          userEmail: user.email,
          userRole: user.role,
        },
      },
    });

    return successResponse(user, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

