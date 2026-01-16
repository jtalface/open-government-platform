import { PrismaClient, UserRole, TicketPriority, IncidentStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.ticketUpdate.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.incidentEvent.deleteMany();
  await prisma.category.deleteMany();
  await prisma.neighborhood.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.municipality.deleteMany();

  // Create Municipality
  const lisbon = await prisma.municipality.create({
    data: {
      name: "Lisboa",
      slug: "lisboa",
      settings: {
        mapCenter: { lat: 38.7223, lng: -9.1393 },
        mapZoom: 12,
        votingRadius: 1000,
        scoreWeights: {
          neighborhoodVoteWeight: 2.0,
          globalVoteWeight: 1.0,
          recencyDecayDays: 30,
        },
        publicTicketsEnabled: true,
        guestReportingEnabled: false,
      },
      active: true,
    },
  });

  console.log("✓ Created municipality: Lisboa");

  // Create Neighborhoods - NOTE: Use camelCase column names!
  await prisma.$executeRaw`
    INSERT INTO neighborhoods (id, "municipalityId", name, slug, geometry, active, "createdAt", "updatedAt")
    VALUES (
      gen_random_uuid(),
      ${lisbon.id}::uuid,
      'Alfama',
      'alfama',
      ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[-9.13,38.71],[-9.12,38.71],[-9.12,38.72],[-9.13,38.72],[-9.13,38.71]]]}'),
      true,
      NOW(),
      NOW()
    )
  `;

  await prisma.$executeRaw`
    INSERT INTO neighborhoods (id, "municipalityId", name, slug, geometry, active, "createdAt", "updatedAt")
    VALUES (
      gen_random_uuid(),
      ${lisbon.id}::uuid,
      'Belém',
      'belem',
      ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[-9.22,38.69],[-9.20,38.69],[-9.20,38.70],[-9.22,38.70],[-9.22,38.69]]]}'),
      true,
      NOW(),
      NOW()
    )
  `;

  await prisma.$executeRaw`
    INSERT INTO neighborhoods (id, "municipalityId", name, slug, geometry, active, "createdAt", "updatedAt")
    VALUES (
      gen_random_uuid(),
      ${lisbon.id}::uuid,
      'Baixa',
      'baixa',
      ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[-9.14,38.70],[-9.13,38.70],[-9.13,38.71],[-9.14,38.71],[-9.14,38.70]]]}'),
      true,
      NOW(),
      NOW()
    )
  `;

  const createdNeighborhoods = await prisma.neighborhood.findMany({
    where: { municipalityId: lisbon.id },
  });

  console.log(`✓ Created ${createdNeighborhoods.length} neighborhoods`);

  // Create Categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        municipalityId: lisbon.id,
        name: "Saúde Pública",
        slug: "saude-publica",
        icon: "health",
        color: "#EF4444",
        description: "Questões de saúde pública e saneamento",
        sortOrder: 1,
      },
    }),
    prisma.category.create({
      data: {
        municipalityId: lisbon.id,
        name: "Obras Públicas e Habitação",
        slug: "obras-publicas",
        icon: "construction",
        color: "#F59E0B",
        description: "Infraestrutura, construção e habitação",
        sortOrder: 2,
      },
    }),
    prisma.category.create({
      data: {
        municipalityId: lisbon.id,
        name: "Segurança Pública",
        slug: "seguranca-publica",
        icon: "shield",
        color: "#3B82F6",
        description: "Questões de segurança e policiamento",
        sortOrder: 3,
      },
    }),
    prisma.category.create({
      data: {
        municipalityId: lisbon.id,
        name: "Eventos",
        slug: "eventos",
        icon: "calendar",
        color: "#8B5CF6",
        description: "Eventos comunitários e culturais",
        sortOrder: 4,
      },
    }),
  ]);

  console.log(`✓ Created ${categories.length} categories`);

  // Create Users
  const hashedPassword = await bcrypt.hash("demo123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@lisboa.pt",
      name: "Admin Lisboa",
      password: hashedPassword,
      role: UserRole.ADMIN,
      municipalityId: lisbon.id,
      neighborhoodId: createdNeighborhoods[0].id,
      location: { lat: 38.7167, lng: -9.1333 },
      emailVerified: new Date(),
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: "manager@lisboa.pt",
      name: "Manager Lisboa",
      password: hashedPassword,
      role: UserRole.MANAGER,
      municipalityId: lisbon.id,
      neighborhoodId: createdNeighborhoods[1].id,
      location: { lat: 38.6972, lng: -9.2064 },
      emailVerified: new Date(),
    },
  });

  const citizen1 = await prisma.user.create({
    data: {
      email: "citizen1@example.com",
      name: "Maria Silva",
      password: hashedPassword,
      role: UserRole.CITIZEN,
      municipalityId: lisbon.id,
      neighborhoodId: createdNeighborhoods[0].id,
      location: { lat: 38.7139, lng: -9.1286 },
      emailVerified: new Date(),
    },
  });

  const citizen2 = await prisma.user.create({
    data: {
      email: "citizen2@example.com",
      name: "João Santos",
      password: hashedPassword,
      role: UserRole.CITIZEN,
      municipalityId: lisbon.id,
      neighborhoodId: createdNeighborhoods[1].id,
      location: { lat: 38.6978, lng: -9.2083 },
      emailVerified: new Date(),
    },
  });

  const citizen3 = await prisma.user.create({
    data: {
      email: "citizen3@example.com",
      name: "Ana Costa",
      password: hashedPassword,
      role: UserRole.CITIZEN,
      municipalityId: lisbon.id,
      neighborhoodId: createdNeighborhoods[2].id,
      location: { lat: 38.7078, lng: -9.1369 },
      emailVerified: new Date(),
    },
  });

  console.log("✓ Created 5 test users");

  // Create Incidents - NOTE: Use camelCase column names!
  await prisma.$executeRaw`
    INSERT INTO incident_events (
      id, "municipalityId", "categoryId", title, description,
      location, lat, lng, geohash, "neighborhoodId",
      status, "createdByUserId", media, "voteStats", "importanceScore",
      "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid(),
      ${lisbon.id}::uuid,
      ${categories[0].id}::uuid,
      'Lixo acumulado na Rua Augusta',
      'Há lixo acumulado há vários dias na esquina da Rua Augusta com a Rua da Prata.',
      ST_SetSRID(ST_MakePoint(-9.1369, 38.7078), 4326),
      38.7078,
      -9.1369,
      'ezjm6',
      ${createdNeighborhoods[2].id}::uuid,
      'OPEN'::"IncidentStatus",
      ${citizen3.id}::uuid,
      '[]'::json,
      '{"total": 0, "upvotes": 0, "downvotes": 0, "byNeighborhood": {}}'::json,
      0.0,
      NOW() - INTERVAL '2 days',
      NOW() - INTERVAL '2 days'
    )
  `;

  await prisma.$executeRaw`
    INSERT INTO incident_events (
      id, "municipalityId", "categoryId", title, description,
      location, lat, lng, geohash, "neighborhoodId",
      status, "createdByUserId", media, "voteStats", "importanceScore",
      "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid(),
      ${lisbon.id}::uuid,
      ${categories[1].id}::uuid,
      'Buraco na estrada',
      'Buraco grande no asfalto em frente ao número 45.',
      ST_SetSRID(ST_MakePoint(-9.1286, 38.7139), 4326),
      38.7139,
      -9.1286,
      'ezjm7',
      ${createdNeighborhoods[0].id}::uuid,
      'OPEN'::"IncidentStatus",
      ${citizen1.id}::uuid,
      '[]'::json,
      '{"total": 0, "upvotes": 0, "downvotes": 0, "byNeighborhood": {}}'::json,
      0.0,
      NOW() - INTERVAL '1 day',
      NOW() - INTERVAL '1 day'
    )
  `;

  await prisma.$executeRaw`
    INSERT INTO incident_events (
      id, "municipalityId", "categoryId", title, description,
      location, lat, lng, geohash, "neighborhoodId",
      status, "createdByUserId", media, "voteStats", "importanceScore",
      "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid(),
      ${lisbon.id}::uuid,
      ${categories[2].id}::uuid,
      'Iluminação pública avariada',
      'Os postes de luz estão apagados há uma semana.',
      ST_SetSRID(ST_MakePoint(-9.2083, 38.6978), 4326),
      38.6978,
      -9.2083,
      'eyjp8',
      ${createdNeighborhoods[1].id}::uuid,
      'OPEN'::"IncidentStatus",
      ${citizen2.id}::uuid,
      '[]'::json,
      '{"total": 0, "upvotes": 0, "downvotes": 0, "byNeighborhood": {}}'::json,
      0.0,
      NOW() - INTERVAL '12 hours',
      NOW() - INTERVAL '12 hours'
    )
  `;

  console.log("✓ Created 3 sample incidents");

  console.log("✅ Database seeded successfully!");
  console.log("\n📋 Test Accounts:");
  console.log("   Admin:   admin@lisboa.pt / demo123");
  console.log("   Manager: manager@lisboa.pt / demo123");
  console.log("   Citizen: citizen1@example.com / demo123");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
