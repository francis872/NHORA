// Seed script — creates a default ADMIN account and demo resources for local development.
// Run with: pnpm db:seed
import { PrismaClient, Role, ResourceType } from "./generated/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

// Demo resources around Bogotá, Colombia (section 31 — earthquake use case).
const DEMO_RESOURCES: Array<{
  type: ResourceType;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  capacity?: number;
}> = [
  {
    type: ResourceType.HOSPITAL,
    name: "Hospital San Ignacio (demo)",
    latitude: 4.628_58,
    longitude: -74.064_76,
    address: "Cra. 7 #40-62, Bogotá",
    capacity: 250,
  },
  {
    type: ResourceType.HOSPITAL,
    name: "Hospital Simón Bolívar (demo)",
    latitude: 4.663_2,
    longitude: -74.087_3,
    address: "Cll. 165 #7-06, Bogotá",
    capacity: 180,
  },
  {
    type: ResourceType.SHELTER,
    name: "Coliseo El Salitre (demo)",
    latitude: 4.657_8,
    longitude: -74.093_5,
    capacity: 500,
  },
  {
    type: ResourceType.FIRE_STATION,
    name: "Estación de Bomberos Centro (demo)",
    latitude: 4.598_1,
    longitude: -74.075_9,
  },
  {
    type: ResourceType.POLICE_STATION,
    name: "CAI Chapinero (demo)",
    latitude: 4.648_1,
    longitude: -74.063_2,
  },
  {
    type: ResourceType.SUPPLY_POINT,
    name: "Punto de acopio Parque Nacional (demo)",
    latitude: 4.626_4,
    longitude: -74.066_1,
  },
];

async function seedAdmin() {
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

async function seedResources() {
  const count = await prisma.resource.count();
  if (count > 0) {
    console.log(`Seed: resources already present (${count}), skipping.`);
    return;
  }

  await prisma.resource.createMany({ data: DEMO_RESOURCES });
  console.log(`Seed: created ${DEMO_RESOURCES.length} demo resources`);
}

async function main() {
  await seedAdmin();
  await seedResources();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
