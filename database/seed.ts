// Seed script — creates a default ADMIN account for local development.
// Run with: pnpm db:seed
import { PrismaClient, Role } from "./generated/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@nora.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Seed: admin user already exists (${email}), skipping.`);
    return;
  }

  const passwordHash = await hash(password, 12);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName: "NORA Administrator",
      role: Role.ADMIN,
    },
  });

  console.log(`Seed: created admin user ${email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
