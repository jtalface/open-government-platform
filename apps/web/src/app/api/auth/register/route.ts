import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@ogp/database";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  isValidSecurityQuestionId,
  normalizeSecurityAnswer,
} from "@/lib/auth/security-questions";

// Beira city bounding box
const BEIRA_BOUNDING_BOX = {
  minLat: -19.88,  // South
  maxLat: -19.66,  // North
  minLng: 34.78,   // West
  maxLng: 34.91,   // East
};

function isWithinBeira(lat: number, lng: number): boolean {
  return (
    lat >= BEIRA_BOUNDING_BOX.minLat &&
    lat <= BEIRA_BOUNDING_BOX.maxLat &&
    lng >= BEIRA_BOUNDING_BOX.minLng &&
    lng <= BEIRA_BOUNDING_BOX.maxLng
  );
}

const RegisterSchema = z
  .object({
    name: z.string().min(1, "Nome é obrigatório"),
    phone: z.string().min(9, "Número de telefone inválido"),
    password: z.string().min(6, "A palavra-passe deve ter pelo menos 6 caracteres"),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    securityQuestion1Id: z.coerce.number().int(),
    securityQuestion2Id: z.coerce.number().int(),
    securityQuestion3Id: z.coerce.number().int(),
    securityAnswer1: z.string().min(2, "Resposta 1 demasiado curta").max(200),
    securityAnswer2: z.string().min(2, "Resposta 2 demasiado curta").max(200),
    securityAnswer3: z.string().min(2, "Resposta 3 demasiado curta").max(200),
  })
  .refine(
    (d) =>
      new Set([
        d.securityQuestion1Id,
        d.securityQuestion2Id,
        d.securityQuestion3Id,
      ]).size === 3,
    { message: "Escolha três perguntas diferentes.", path: ["securityQuestion3Id"] }
  )
  .refine(
    (d) =>
      [d.securityQuestion1Id, d.securityQuestion2Id, d.securityQuestion3Id].every(
        (id) => isValidSecurityQuestionId(id)
      ),
    { message: "Pergunta de segurança inválida.", path: ["securityQuestion1Id"] }
  );

/**
 * POST /api/auth/register
 * Public endpoint for user registration
 * Requires location verification within Beira city limits
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = RegisterSchema.safeParse(body);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      return NextResponse.json(
        { error: { message: firstIssue?.message ?? "Dados inválidos." } },
        { status: 400 }
      );
    }

    const {
      name,
      phone,
      password,
      latitude,
      longitude,
      securityQuestion1Id,
      securityQuestion2Id,
      securityQuestion3Id,
      securityAnswer1,
      securityAnswer2,
      securityAnswer3,
    } = result.data;

    // Check if phone number already exists
    const existingUser = await prisma.user.findFirst({
      where: { phone },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: { message: "Este número de telefone já está registado." } },
        { status: 400 }
      );
    }

    // Get the Beira municipality
    const municipality = await prisma.municipality.findFirst({
      where: { name: "Beira" },
    });

    if (!municipality) {
      return NextResponse.json(
        { error: { message: "Erro interno: município não encontrado." } },
        { status: 500 }
      );
    }

    // Find the neighborhood based on user location (if provided)
    let neighborhood: { id: string }[] = [];
    if (latitude != null && longitude != null) {
      neighborhood = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "neighborhoods"
        WHERE "municipalityId" = ${municipality.id}
          AND ST_Contains(
            geometry,
            ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
          )
        LIMIT 1
      `;
    }

    // Hash password and security answers (normalized)
    const hashedPassword = await bcrypt.hash(password, 10);
    const [hashA1, hashA2, hashA3] = await Promise.all([
      bcrypt.hash(normalizeSecurityAnswer(securityAnswer1), 10),
      bcrypt.hash(normalizeSecurityAnswer(securityAnswer2), 10),
      bcrypt.hash(normalizeSecurityAnswer(securityAnswer3), 10),
    ]);

    // Generate a unique email-like identifier from phone (since email is required in schema)
    const emailFromPhone = `${phone.replace(/\D/g, "")}@phone.beira.gov.mz`;

    // Create user as CITIZEN
    const user = await prisma.user.create({
      data: {
        name,
        phone,
        email: emailFromPhone,
        password: hashedPassword,
        role: "CITIZEN",
        municipalityId: municipality.id,
        neighborhoodId: neighborhood.length > 0 ? neighborhood[0].id : null,
        active: true,
        securityQuestion1Id,
        securityQuestion2Id,
        securityQuestion3Id,
        securityAnswer1: hashA1,
        securityAnswer2: hashA2,
        securityAnswer3: hashA3,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        municipalityId: municipality.id,
        actorUserId: user.id,
        entityType: "User",
        entityId: user.id,
        action: "CREATE",
        metadata: {
          userName: user.name,
          userPhone: user.phone,
          userRole: user.role,
          registrationMethod: "self-signup",
          location: { latitude, longitude },
        },
      },
    });

    return NextResponse.json(
      { 
        success: true, 
        message: "Conta criada com sucesso. Pode agora entrar com o seu número de telefone." 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          {
            error: {
              message:
                "Este número de telefone ou email já está associado a uma conta.",
            },
          },
          { status: 400 }
        );
      }
    }

    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: {
          message: "Ocorreu um erro ao criar a conta. Tente novamente.",
          ...(process.env.NODE_ENV !== "production" ? { detail } : {}),
        },
      },
      { status: 500 }
    );
  }
}
