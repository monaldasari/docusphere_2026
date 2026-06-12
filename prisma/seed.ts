import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// prisma/seed.ts
async function main() {
  const prisma = new PrismaClient();
  
  // Create a test user
  const password = await bcrypt.hash("password123", 10);
  const user = await prisma.user.upsert({
    where: { email: "user@test.io" },
    update: {},
    create: {
      email: "user@test.io",
      password: password,
      name: "Demo User",
      streak: 12,
    },
  });

  // Create an admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@test.io" },
    update: {},
    create: {
      email: "admin@test.io",
      password: adminPassword,
      name: "Admin User",
      role: "admin",
      streak: 5,
    },
  });

  console.log({ user, admin });

  // Create initial documents
  const doc1 = await prisma.document.create({
    data: {
      title: "Product Requirements Document",
      emoji: "📋",
      excerpt: "Phase 1 MVP specifications for DocuSphere collaborative editor platform...",
      content: "<h1>Product Requirements</h1><p>This is a real document from the database.</p>",
      ownerId: user.id,
      starred: true,
    },
  });

  const doc2 = await prisma.document.create({
    data: {
      title: "Q2 Launch Roadmap",
      emoji: "🚀",
      excerpt: "Timeline and milestones for the Q2 product launch. Key features include...",
      content: "<h1>Q2 Roadmap</h1><p>Roadmap details...</p>",
      ownerId: user.id,
      shared: true,
      inviteToken: "invite-abc123",
    },
  });

  console.log("Seeding finished. ✅");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
