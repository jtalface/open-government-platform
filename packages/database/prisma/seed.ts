import { PrismaClient, UserRole, TicketPriority, IncidentStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Beira City Bounding Box
const BEIRA_BOUNDS = {
  minLat: -19.88,  // South
  maxLat: -19.66,  // North
  minLng: 34.78,   // West
  maxLng: 34.91,   // East
  center: {
    lat: -19.83,
    lng: 34.845,
  },
};

async function main() {
  console.log("🌱 Starting database seed...");
  console.log(`📍 Beira bounds: Lat [${BEIRA_BOUNDS.minLat}, ${BEIRA_BOUNDS.maxLat}], Lng [${BEIRA_BOUNDS.minLng}, ${BEIRA_BOUNDS.maxLng}]`);

  // Clean existing data (in correct order to respect foreign keys)
  await prisma.auditLog.deleteMany();
  await prisma.pollVote.deleteMany();
  await prisma.poll.deleteMany();
  await prisma.projectUpdate.deleteMany();
  await prisma.project.deleteMany();
  await prisma.ticketUpdate.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.channelPost.deleteMany();
  await prisma.channelPermission.deleteMany();
  await prisma.officialChannel.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.incidentEvent.deleteMany();
  await prisma.category.deleteMany();
  await prisma.neighborhood.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.municipality.deleteMany();

  // Create Municipality - Beira, Mozambique
  const beira = await prisma.municipality.create({
    data: {
      name: "Beira",
      slug: "beira",
      settings: {
        mapCenter: BEIRA_BOUNDS.center,
        mapZoom: 13,
        mapBounds: {
          minLat: BEIRA_BOUNDS.minLat,
          maxLat: BEIRA_BOUNDS.maxLat,
          minLng: BEIRA_BOUNDS.minLng,
          maxLng: BEIRA_BOUNDS.maxLng,
        },
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

  console.log("✓ Created municipality: Beira");

  // Create Neighborhoods for Beira - NOTE: Use camelCase column names!
  // Beira neighborhoods within bounding box: Lat [-19.88, -19.66], Lng [34.78, 34.91]
  
  // Ponta Gêa - Central/Coastal area (eastern part of city near the port)
  await prisma.$executeRaw`
    INSERT INTO neighborhoods (id, "municipalityId", name, slug, geometry, active, "createdAt", "updatedAt")
    VALUES (
      gen_random_uuid(),
      ${beira.id}::uuid,
      'Ponta Gêa',
      'ponta-gea',
      ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[34.84,-19.84],[34.88,-19.84],[34.88,-19.80],[34.84,-19.80],[34.84,-19.84]]]}'),
      true,
      NOW(),
      NOW()
    )
  `;

  // Macurungo - Southern residential area
  await prisma.$executeRaw`
    INSERT INTO neighborhoods (id, "municipalityId", name, slug, geometry, active, "createdAt", "updatedAt")
    VALUES (
      gen_random_uuid(),
      ${beira.id}::uuid,
      'Macurungo',
      'macurungo',
      ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[34.82,-19.88],[34.88,-19.88],[34.88,-19.84],[34.82,-19.84],[34.82,-19.88]]]}'),
      true,
      NOW(),
      NOW()
    )
  `;

  // Chaimite - Western area
  await prisma.$executeRaw`
    INSERT INTO neighborhoods (id, "municipalityId", name, slug, geometry, active, "createdAt", "updatedAt")
    VALUES (
      gen_random_uuid(),
      ${beira.id}::uuid,
      'Chaimite',
      'chaimite',
      ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[34.78,-19.84],[34.84,-19.84],[34.84,-19.80],[34.78,-19.80],[34.78,-19.84]]]}'),
      true,
      NOW(),
      NOW()
    )
  `;

  // Munhava - Northern industrial area
  await prisma.$executeRaw`
    INSERT INTO neighborhoods (id, "municipalityId", name, slug, geometry, active, "createdAt", "updatedAt")
    VALUES (
      gen_random_uuid(),
      ${beira.id}::uuid,
      'Munhava',
      'munhava',
      ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[34.78,-19.70],[34.84,-19.70],[34.84,-19.66],[34.78,-19.66],[34.78,-19.70]]]}'),
      true,
      NOW(),
      NOW()
    )
  `;

  const createdNeighborhoods = await prisma.neighborhood.findMany({
    where: { municipalityId: beira.id },
  });

  console.log(`✓ Created ${createdNeighborhoods.length} neighborhoods within Beira bounds`);

  // Create Categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        municipalityId: beira.id,
        name: "Saúde Pública",
        slug: "saude-publica",
        icon: "🏥",
        color: "#EF4444",
        description: "Questões de saúde pública e saneamento",
        sortOrder: 1,
      },
    }),
    prisma.category.create({
      data: {
        municipalityId: beira.id,
        name: "Obras Públicas e Habitação",
        slug: "obras-publicas",
        icon: "🏗️",
        color: "#F59E0B",
        description: "Infraestrutura, construção e habitação",
        sortOrder: 2,
      },
    }),
    prisma.category.create({
      data: {
        municipalityId: beira.id,
        name: "Segurança Pública",
        slug: "seguranca-publica",
        icon: "🛡️",
        color: "#3B82F6",
        description: "Questões de segurança e policiamento",
        sortOrder: 3,
      },
    }),
    prisma.category.create({
      data: {
        municipalityId: beira.id,
        name: "Eventos",
        slug: "eventos",
        icon: "📅",
        color: "#8B5CF6",
        description: "Eventos comunitários e culturais",
        sortOrder: 4,
      },
    }),
  ]);

  console.log(`✓ Created ${categories.length} categories`);

  // Create Users - all locations within Beira bounding box
  const hashedPassword = await bcrypt.hash("demo123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@beira.gov.mz",
      name: "Admin Beira",
      password: hashedPassword,
      role: UserRole.ADMIN,
      municipalityId: beira.id,
      neighborhoodId: createdNeighborhoods[0].id, // Ponta Gêa
      location: { lat: -19.82, lng: 34.86 }, // Ponta Gêa area
      emailVerified: new Date(),
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: "manager@beira.gov.mz",
      name: "Manager Beira",
      password: hashedPassword,
      role: UserRole.MANAGER,
      municipalityId: beira.id,
      neighborhoodId: createdNeighborhoods[1].id, // Macurungo
      location: { lat: -19.86, lng: 34.85 }, // Macurungo area
      emailVerified: new Date(),
    },
  });

  const citizen1 = await prisma.user.create({
    data: {
      email: "citizen1@example.com",
      name: "Maria Nhaca",
      password: hashedPassword,
      role: UserRole.CITIZEN,
      municipalityId: beira.id,
      neighborhoodId: createdNeighborhoods[0].id, // Ponta Gêa
      location: { lat: -19.83, lng: 34.87 }, // Ponta Gêa area
      emailVerified: new Date(),
    },
  });

  const citizen2 = await prisma.user.create({
    data: {
      email: "citizen2@example.com",
      name: "João Machava",
      password: hashedPassword,
      role: UserRole.CITIZEN,
      municipalityId: beira.id,
      neighborhoodId: createdNeighborhoods[1].id, // Macurungo
      location: { lat: -19.85, lng: 34.84 }, // Macurungo area
      emailVerified: new Date(),
    },
  });

  const citizen3 = await prisma.user.create({
    data: {
      email: "citizen3@example.com",
      name: "Ana Tembe",
      password: hashedPassword,
      role: UserRole.CITIZEN,
      municipalityId: beira.id,
      neighborhoodId: createdNeighborhoods[2].id, // Chaimite
      location: { lat: -19.82, lng: 34.81 }, // Chaimite area
      emailVerified: new Date(),
    },
  });

  console.log("✓ Created 5 test users");

  // Create Incidents - All within Beira bounding box
  // Bounding box: Lat [-19.88, -19.66], Lng [34.78, 34.91]
  
  // Incident 1: Chaimite neighborhood (western area)
  await prisma.$executeRaw`
    INSERT INTO incident_events (
      id, "municipalityId", "categoryId", title, description,
      location, lat, lng, geohash, "neighborhoodId",
      status, "createdByUserId", media, "voteStats", "importanceScore",
      "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid(),
      ${beira.id}::uuid,
      ${categories[0].id}::uuid,
      'Lixo acumulado na Avenida Eduardo Mondlane',
      'Há lixo acumulado há vários dias na esquina da Avenida Eduardo Mondlane com a Rua do Porto.',
      ST_SetSRID(ST_MakePoint(34.81, -19.82), 4326),
      -19.82,
      34.81,
      'kzpqv',
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

  // Incident 2: Ponta Gêa neighborhood (central/coastal area)
  await prisma.$executeRaw`
    INSERT INTO incident_events (
      id, "municipalityId", "categoryId", title, description,
      location, lat, lng, geohash, "neighborhoodId",
      status, "createdByUserId", media, "voteStats", "importanceScore",
      "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid(),
      ${beira.id}::uuid,
      ${categories[1].id}::uuid,
      'Buraco na estrada',
      'Buraco grande no asfalto em frente ao Mercado Central de Beira.',
      ST_SetSRID(ST_MakePoint(34.86, -19.82), 4326),
      -19.82,
      34.86,
      'kzpqw',
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

  // Incident 3: Macurungo neighborhood (southern area)
  await prisma.$executeRaw`
    INSERT INTO incident_events (
      id, "municipalityId", "categoryId", title, description,
      location, lat, lng, geohash, "neighborhoodId",
      status, "createdByUserId", media, "voteStats", "importanceScore",
      "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid(),
      ${beira.id}::uuid,
      ${categories[2].id}::uuid,
      'Iluminação pública avariada',
      'Os postes de luz estão apagados há uma semana no bairro Macurungo.',
      ST_SetSRID(ST_MakePoint(34.85, -19.86), 4326),
      -19.86,
      34.85,
      'kzpqx',
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

  // Incident 4: Munhava neighborhood (northern area)
  await prisma.$executeRaw`
    INSERT INTO incident_events (
      id, "municipalityId", "categoryId", title, description,
      location, lat, lng, geohash, "neighborhoodId",
      status, "createdByUserId", media, "voteStats", "importanceScore",
      "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid(),
      ${beira.id}::uuid,
      ${categories[3].id}::uuid,
      'Inundação na estrada principal',
      'Água parada após chuvas fortes na entrada do bairro Munhava.',
      ST_SetSRID(ST_MakePoint(34.80, -19.79), 4326),
      -19.79,
      34.80,
      'kzpqy',
      ${createdNeighborhoods[3].id}::uuid,
      'TRIAGED'::"IncidentStatus",
      ${citizen1.id}::uuid,
      '[]'::json,
      '{"total": 2, "upvotes": 2, "downvotes": 0, "byNeighborhood": {}}'::json,
      2.0,
      NOW() - INTERVAL '3 days',
      NOW() - INTERVAL '3 days'
    )
  `;

  // Incident 5: Ponta Gêa - near the port
  await prisma.$executeRaw`
    INSERT INTO incident_events (
      id, "municipalityId", "categoryId", title, description,
      location, lat, lng, geohash, "neighborhoodId",
      status, "createdByUserId", media, "voteStats", "importanceScore",
      "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid(),
      ${beira.id}::uuid,
      ${categories[1].id}::uuid,
      'Passeio danificado junto ao porto',
      'O passeio está em mau estado junto à zona portuária, perigo para peões.',
      ST_SetSRID(ST_MakePoint(34.87, -19.81), 4326),
      -19.81,
      34.87,
      'kzpqz',
      ${createdNeighborhoods[0].id}::uuid,
      'OPEN'::"IncidentStatus",
      ${citizen2.id}::uuid,
      '[]'::json,
      '{"total": 1, "upvotes": 1, "downvotes": 0, "byNeighborhood": {}}'::json,
      1.0,
      NOW() - INTERVAL '6 hours',
      NOW() - INTERVAL '6 hours'
    )
  `;

  console.log("✓ Created 5 sample incidents within Beira bounds");

  // Create Official Channels
  const mayorChannel = await prisma.officialChannel.create({
    data: {
      municipalityId: beira.id,
      name: "Albano Carige",
      title: "Presidente do Conselho Municipal",
      bio: "Dedicado a tornar Beira uma cidade melhor para todos os cidadãos. Comprometido com a transparência e participação cidadã.",
      isActive: true,
    },
  });

  const publicWorksChannel = await prisma.officialChannel.create({
    data: {
      municipalityId: beira.id,
      name: "Eng. Paulo Mbele",
      title: "Director de Obras Públicas",
      bio: "Gestão de projectos de infraestrutura e obras públicas em todo o município.",
      isActive: true,
    },
  });

  const publicHealthChannel = await prisma.officialChannel.create({
    data: {
      municipalityId: beira.id,
      name: "Dr. Amina Ndlovu",
      title: "Directora de Saúde Pública",
      bio: "Supervisão de iniciativas de saúde pública e programas de bem-estar comunitário.",
      isActive: true,
    },
  });

  console.log("✓ Created 3 official channels");

  // Grant channel permissions to manager and admin
  await prisma.channelPermission.create({
    data: {
      municipalityId: beira.id,
      channelId: mayorChannel.id,
      userId: admin.id,
      roleGrantedByUserId: admin.id,
    },
  });

  await prisma.channelPermission.create({
    data: {
      municipalityId: beira.id,
      channelId: publicWorksChannel.id,
      userId: manager.id,
      roleGrantedByUserId: admin.id,
    },
  });

  await prisma.channelPermission.create({
    data: {
      municipalityId: beira.id,
      channelId: publicHealthChannel.id,
      userId: admin.id,
      roleGrantedByUserId: admin.id,
    },
  });

  console.log("✓ Granted channel permissions");

  // Create sample channel posts
  await prisma.channelPost.create({
    data: {
      municipalityId: beira.id,
      channelId: mayorChannel.id,
      authorUserId: admin.id,
      title: "Bem-vindos à Nova Plataforma de Participação Cidadã",
      body: "É com grande satisfação que anuncio o lançamento da nossa nova plataforma digital de participação cidadã. Esta plataforma vai ajudar-nos a manter contacto convosco e resolver as preocupações da comunidade de forma mais eficiente. Juntos, podemos fazer da Beira um lugar ainda melhor para viver!",
      visibility: "PUBLIC",
    },
  });

  await prisma.channelPost.create({
    data: {
      municipalityId: beira.id,
      channelId: publicWorksChannel.id,
      authorUserId: manager.id,
      title: "Calendário de Manutenção de Estradas - Março 2026",
      body: "Vamos realizar manutenção de rotina nas estradas dos bairros Ponta Gêa e Macurungo a partir da próxima semana. Por favor, aguardem pequenos atrasos e sigam os sinais de desvio. Obrigado pela vossa paciência enquanto melhoramos a nossa infraestrutura.",
      visibility: "PUBLIC",
    },
  });

  await prisma.channelPost.create({
    data: {
      municipalityId: beira.id,
      channelId: publicHealthChannel.id,
      authorUserId: admin.id,
      title: "Rastreios de Saúde Gratuitos Este Fim de Semana",
      body: "Juntem-se a nós este Sábado e Domingo para rastreios de saúde gratuitos no centro comunitário. Os serviços incluem verificação de pressão arterial, rastreio de diabetes e consultas de saúde geral. Aberto a todos os residentes.",
      visibility: "PUBLIC",
    },
  });

  console.log("✓ Created 3 sample channel posts");

  // Create Tickets
  const ticket1 = await prisma.ticket.create({
    data: {
      municipalityId: beira.id,
      categoryId: categories[0].id, // Saúde Pública
      title: "Implementar sistema de triagem no centro de saúde",
      description: "Necessário criar um sistema de triagem para melhorar o atendimento no centro de saúde de Ponta Gêa.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      createdByUserId: manager.id,
      publicVisibility: "PUBLIC",
    },
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      municipalityId: beira.id,
      categoryId: categories[1].id, // Obras Públicas
      title: "Reparação de pavimento na Avenida Eduardo Mondlane",
      description: "Reparar buracos e renovar pavimento ao longo de 2km da Avenida Eduardo Mondlane.",
      status: "DONE",
      priority: "URGENT",
      createdByUserId: manager.id,
      assignedToUserId: manager.id,
      publicVisibility: "PUBLIC",
    },
  });

  const ticket3 = await prisma.ticket.create({
    data: {
      municipalityId: beira.id,
      categoryId: categories[2].id, // Segurança Pública
      title: "Instalação de câmeras de vigilância",
      description: "Instalar sistema de vigilância em áreas identificadas como críticas.",
      status: "NEW",
      priority: "MEDIUM",
      createdByUserId: admin.id,
      publicVisibility: "PUBLIC",
    },
  });

  const ticket4 = await prisma.ticket.create({
    data: {
      municipalityId: beira.id,
      categoryId: categories[1].id, // Obras Públicas
      title: "Construção de novo parque infantil",
      description: "Projeto para construção de parque infantil no bairro Macurungo.",
      status: "DONE",
      priority: "MEDIUM",
      createdByUserId: admin.id,
      assignedToUserId: manager.id,
      publicVisibility: "PUBLIC",
    },
  });

  console.log("✓ Created 4 sample tickets");

  // Create Projects
  const project1 = await prisma.project.create({
    data: {
      municipalityId: beira.id,
      ticketId: ticket1.id,
      categoryId: categories[0].id,
      title: "Sistema de Triagem - Centro de Saúde Ponta Gêa",
      description: "Implementação de sistema digital de triagem para otimizar o atendimento e reduzir tempo de espera. Inclui formação de equipe e instalação de equipamentos.",
      status: "PLANNING",
      budgetAmount: 2500000,
      budgetCurrency: "MZN",
      fundingSource: "Orçamento Municipal 2026",
      createdByUserId: admin.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      municipalityId: beira.id,
      ticketId: ticket2.id,
      categoryId: categories[1].id,
      title: "Renovação Avenida Eduardo Mondlane",
      description: "Projeto de renovação completa do pavimento da Avenida Eduardo Mondlane, incluindo drenagem e sinalização.",
      status: "WORK_STARTED",
      budgetAmount: 15000000,
      budgetCurrency: "MZN",
      fundingSource: "Fundo de Desenvolvimento Distrital",
      biddingReference: "CP-2026-003",
      assignedToName: "Construtora Beira Lda",
      assignedToId: "vendor-001",
      assignedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      workStartedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      createdByUserId: admin.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      municipalityId: beira.id,
      ticketId: ticket4.id,
      categoryId: categories[1].id,
      title: "Parque Infantil de Macurungo",
      description: "Construção de parque infantil moderno com equipamentos de segurança certificados e área verde.",
      status: "COMPLETED",
      budgetAmount: 4500000,
      budgetCurrency: "MZN",
      fundingSource: "Orçamento Municipal 2025",
      biddingReference: "CP-2025-089",
      assignedToName: "Jardins Moçambique Lda",
      assignedToId: "vendor-002",
      assignedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120 days ago
      workStartedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
      completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      archivedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago (archived)
      archivedByUserId: admin.id,
      createdByUserId: admin.id,
    },
  });

  console.log("✓ Created 3 sample projects");

  // Create Project Updates
  await prisma.projectUpdate.create({
    data: {
      projectId: project2.id,
      municipalityId: beira.id,
      authorUserId: manager.id,
      visibility: "PUBLIC",
      message: "Obras iniciadas conforme cronograma. Primeira fase (preparação do terreno) concluída.",
    },
  });

  await prisma.projectUpdate.create({
    data: {
      projectId: project2.id,
      municipalityId: beira.id,
      authorUserId: manager.id,
      visibility: "PUBLIC",
      message: "Segunda fase em andamento. Remoção do pavimento antigo a 60% de conclusão.",
    },
  });

  await prisma.projectUpdate.create({
    data: {
      projectId: project3.id,
      municipalityId: beira.id,
      authorUserId: admin.id,
      visibility: "PUBLIC",
      message: "Projeto concluído com sucesso. Inauguração realizada com presença da comunidade local.",
    },
  });

  console.log("✓ Created project updates");

  // Create sample poll
  const activePoll = await prisma.poll.create({
    data: {
      municipalityId: beira.id,
      createdByUserId: manager.id,
      title: "Should the municipality prioritize pothole repairs this month?",
      optionA: "Yes, absolutely",
      optionB: "No, focus on other issues",
      status: "ACTIVE",
      startsAt: new Date(),
    },
  });

  // Add some sample votes
  await prisma.pollVote.createMany({
    data: [
      {
        municipalityId: beira.id,
        pollId: activePoll.id,
        userId: citizen1.id,
        choice: "A",
      },
      {
        municipalityId: beira.id,
        pollId: activePoll.id,
        userId: citizen2.id,
        choice: "A",
      },
      {
        municipalityId: beira.id,
        pollId: activePoll.id,
        userId: citizen3.id,
        choice: "B",
      },
    ],
  });

  console.log("✓ Created active poll with sample votes");

  console.log("✅ Database seeded successfully!");
  console.log("\n📋 Test Accounts:");
  console.log("   Admin:   admin@beira.gov.mz / demo123");
  console.log("   Manager: manager@beira.gov.mz / demo123");
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
