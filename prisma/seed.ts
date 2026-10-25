import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.vertical.upsert({ where: { key: "housing" }, create: { key: "housing", name: "Wohnungssuche" }, update: {} });

  await prisma.partner.upsert({
    where: { key: "demo-partner" },
    create: {
      key: "demo-partner",
      name: "Demo-Partner Wohnen",
      website: "https://partner.example",
      affiliateUrlTemplate: "https://partner.example/r?ref=wohnungssuche&url={url}",
    },
    update: {},
  });
  await prisma.partner.upsert({
    where: { key: "demo-portal" },
    create: {
      key: "demo-portal",
      name: "Demo-Portal",
      website: "https://portal.example",
      affiliateUrlTemplate: "https://portal.example/go?aff=wohnungssuche&target={url}",
      sponsored: true,
    },
    update: {},
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    create: { email: "admin@example.com", name: "Admin", role: "ADMIN" },
    update: { role: "ADMIN" },
  });
  await prisma.notificationPreference.upsert({
    where: { userId_channel: { userId: admin.id, channel: "EMAIL" } },
    create: { userId: admin.id, channel: "EMAIL", destination: admin.email },
    update: {},
  });

  console.log("Seed fertig: Vertical housing, 2 Partner, Admin admin@example.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
