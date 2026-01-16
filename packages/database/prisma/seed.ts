import { PrismaClient, UserRole, TicketPriority, IncidentStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Clean existing data (in correct order to respect foreign keys)
  await prisma.auditLog.deleteMany();
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
        icon: "🏥",
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
        icon: "🏗️",
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
        icon: "🛡️",
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
        icon: "📅",
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

  // Create Official Channels
  const mayorChannel = await prisma.officialChannel.create({
    data: {
      municipalityId: lisbon.id,
      name: "Maria Santos",
      title: "Mayor of Lisboa",
      bio: "Dedicated to making Lisboa a better place for all citizens. Committed to transparency and citizen engagement.",
      isActive: true,
    },
  });

  const publicWorksChannel = await prisma.officialChannel.create({
    data: {
      municipalityId: lisbon.id,
      name: "Eng. Paulo Mbele",
      title: "Director of Public Works",
      bio: "Managing infrastructure projects and public works across the municipality.",
      isActive: true,
    },
  });

  const publicHealthChannel = await prisma.officialChannel.create({
    data: {
      municipalityId: lisbon.id,
      name: "Dr. Amina Ndlovu",
      title: "Public Health Officer",
      bio: "Overseeing public health initiatives and community wellness programs.",
      isActive: true,
    },
  });

  console.log("✓ Created 3 official channels");

  // Grant channel permissions to manager and admin
  await prisma.channelPermission.create({
    data: {
      municipalityId: lisbon.id,
      channelId: mayorChannel.id,
      userId: admin.id,
      roleGrantedByUserId: admin.id,
    },
  });

  await prisma.channelPermission.create({
    data: {
      municipalityId: lisbon.id,
      channelId: publicWorksChannel.id,
      userId: manager.id,
      roleGrantedByUserId: admin.id,
    },
  });

  await prisma.channelPermission.create({
    data: {
      municipalityId: lisbon.id,
      channelId: publicHealthChannel.id,
      userId: admin.id,
      roleGrantedByUserId: admin.id,
    },
  });

  console.log("✓ Granted channel permissions");

  // Create sample channel posts
  await prisma.channelPost.create({
    data: {
      municipalityId: lisbon.id,
      channelId: mayorChannel.id,
      authorUserId: admin.id,
      title: "Welcome to Our New Citizen Engagement Platform",
      body: "I'm excited to announce the launch of our new digital platform for citizen engagement. This platform will help us stay connected with you and address community concerns more efficiently. Together, we can make Lisboa an even better place to live!",
      visibility: "PUBLIC",
    },
  });

  await prisma.channelPost.create({
    data: {
      municipalityId: lisbon.id,
      channelId: publicWorksChannel.id,
      authorUserId: manager.id,
      title: "Road Maintenance Schedule - March 2026",
      body: "We will be conducting routine road maintenance in the Alfama and Belém neighborhoods starting next week. Please expect minor delays and follow detour signs. Thank you for your patience as we improve our infrastructure.",
      visibility: "PUBLIC",
    },
  });

  await prisma.channelPost.create({
    data: {
      municipalityId: lisbon.id,
      channelId: publicHealthChannel.id,
      authorUserId: admin.id,
      title: "Free Health Screenings This Weekend",
      body: "Join us this Saturday and Sunday for free health screenings at the community center. Services include blood pressure checks, diabetes screening, and general health consultations. Open to all residents.",
      visibility: "PUBLIC",
    },
  });

  console.log("✓ Created 3 sample channel posts");

  // Create Tickets
  const ticket1 = await prisma.ticket.create({
    data: {
      municipalityId: lisbon.id,
      categoryId: categories[0].id, // Saúde Pública
      title: "Implementar sistema de triagem no centro de saúde",
      description: "Necessário criar um sistema de triagem para melhorar o atendimento no centro de saúde da Baixa.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      createdByUserId: manager.id,
      publicVisibility: "PUBLIC",
    },
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      municipalityId: lisbon.id,
      categoryId: categories[1].id, // Obras Públicas
      title: "Reparação de pavimento na Avenida da Liberdade",
      description: "Reparar buracos e renovar pavimento ao longo de 2km da Avenida da Liberdade.",
      status: "DONE",
      priority: "URGENT",
      createdByUserId: manager.id,
      assignedToUserId: manager.id,
      publicVisibility: "PUBLIC",
    },
  });

  const ticket3 = await prisma.ticket.create({
    data: {
      municipalityId: lisbon.id,
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
      municipalityId: lisbon.id,
      categoryId: categories[1].id, // Obras Públicas
      title: "Construção de novo parque infantil",
      description: "Projeto para construção de parque infantil no bairro de Belém.",
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
      municipalityId: lisbon.id,
      ticketId: ticket1.id,
      categoryId: categories[0].id,
      title: "Sistema de Triagem - Centro de Saúde Baixa",
      description: "Implementação de sistema digital de triagem para otimizar o atendimento e reduzir tempo de espera. Inclui formação de equipe e instalação de equipamentos.",
      status: "PLANNING",
      budgetAmount: 25000,
      budgetCurrency: "EUR",
      fundingSource: "Orçamento Municipal 2026",
      createdByUserId: admin.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      municipalityId: lisbon.id,
      ticketId: ticket2.id,
      categoryId: categories[1].id,
      title: "Renovação Avenida da Liberdade",
      description: "Projeto de renovação completa do pavimento da Avenida da Liberdade, incluindo drenagem e sinalização.",
      status: "WORK_STARTED",
      budgetAmount: 150000,
      budgetCurrency: "EUR",
      fundingSource: "Fundo Europeu de Desenvolvimento Regional",
      biddingReference: "CP-2026-003",
      assignedToName: "Construtora Silva & Filhos",
      assignedToId: "vendor-001",
      assignedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      workStartedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      createdByUserId: admin.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      municipalityId: lisbon.id,
      ticketId: ticket4.id,
      categoryId: categories[1].id,
      title: "Parque Infantil de Belém",
      description: "Construção de parque infantil moderno com equipamentos de segurança certificados e área verde.",
      status: "COMPLETED",
      budgetAmount: 45000,
      budgetCurrency: "EUR",
      fundingSource: "Orçamento Municipal 2025",
      biddingReference: "CP-2025-089",
      assignedToName: "Parques & Jardins Lda",
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
      municipalityId: lisbon.id,
      authorUserId: manager.id,
      visibility: "PUBLIC",
      message: "Obras iniciadas conforme cronograma. Primeira fase (preparação do terreno) concluída.",
    },
  });

  await prisma.projectUpdate.create({
    data: {
      projectId: project2.id,
      municipalityId: lisbon.id,
      authorUserId: manager.id,
      visibility: "PUBLIC",
      message: "Segunda fase em andamento. Remoção do pavimento antigo a 60% de conclusão.",
    },
  });

  await prisma.projectUpdate.create({
    data: {
      projectId: project3.id,
      municipalityId: lisbon.id,
      authorUserId: admin.id,
      visibility: "PUBLIC",
      message: "Projeto concluído com sucesso. Inauguração realizada com presença da comunidade local.",
    },
  });

  console.log("✓ Created project updates");

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
