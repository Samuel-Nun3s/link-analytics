import 'dotenv';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("[seed] limpando dados existentes...");
  await prisma.click.deleteMany();
  await prisma.link.deleteMany();

  console.log("[seed] inserindo links de teste...");
  await prisma.link.createMany({
    data: [
      {
        slug: "ghub",
        originalUrl: "https://github.com",
        customSlug: true,
      },
      {
        slug: "expired",
        originalUrl: "https://example.com",
        customSlug: true,
        expiresAt: new Date("2020-01-01"),
      },
      {
        slug: "off",
        originalUrl: "https://example.com",
        customSlug: true,
        active: false,
      },
    ],
  });

  const count = await prisma.link.count();
  console.log(`[seed] pronto. ${count} links no banco.`);
}

main()
  .catch((e) => {
    console.error("[seed] falhou:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
