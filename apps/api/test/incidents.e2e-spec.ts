import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/main";
import { PrismaService } from "../src/prisma/prisma.service";

// Requires the Postgres/PostGIS container running (pnpm docker:up).
describe("Incidents + Map (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const runId = Date.now();
  const citizenEmail = `e2e-citizen-${runId}@example.com`;
  const operatorEmail = `e2e-operator-${runId}@example.com`;
  // Unique-per-run coordinates so this test's dedup check never collides with
  // incidents left over from a previous run or manual testing.
  const baseLat = 4.6 + (runId % 1000) / 100000;
  const baseLng = -74.06 - (runId % 1000) / 100000;
  let citizenToken: string;
  let operatorToken: string;
  let incidentId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);

    const citizenRes = await request(app.getHttpServer()).post("/api/v1/auth/register").send({
      email: citizenEmail,
      password: "SecurePass123!",
      fullName: "E2E Citizen",
    });
    citizenToken = citizenRes.body.tokens.accessToken;

    const operatorRes = await request(app.getHttpServer()).post("/api/v1/auth/register").send({
      email: operatorEmail,
      password: "SecurePass123!",
      fullName: "E2E Operator",
    });
    await prisma.user.update({
      where: { email: operatorEmail },
      data: { role: "OPERATOR" },
    });
    const operatorLogin = await request(app.getHttpServer()).post("/api/v1/auth/login").send({
      email: operatorEmail,
      password: "SecurePass123!",
    });
    operatorToken = operatorLogin.body.tokens.accessToken;
    void operatorRes;
  });

  afterAll(async () => {
    await prisma.incident.deleteMany({
      where: { reportedBy: { email: { in: [citizenEmail, operatorEmail] } } },
    });
    await prisma.user.deleteMany({ where: { email: { in: [citizenEmail, operatorEmail] } } });
    await app.close();
  });

  it("creates an incident with a computed priority score", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/v1/incidents")
      .set("Authorization", `Bearer ${citizenToken}`)
      .send({
        type: "STRUCTURAL_DAMAGE",
        description: "Grietas visibles en fachada tras el sismo",
        latitude: baseLat,
        longitude: baseLng,
        peopleAffected: 5,
      })
      .expect(201);

    expect(res.body.merged).toBe(false);
    expect(res.body.incident.priorityScore).toBeGreaterThan(0);
    incidentId = res.body.incident.id;
  });

  it("merges a nearby, same-type report into the existing incident instead of duplicating it", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/v1/incidents")
      .set("Authorization", `Bearer ${citizenToken}`)
      .send({
        type: "STRUCTURAL_DAMAGE",
        description: "Otro vecino confirma el mismo edificio agrietado",
        latitude: baseLat + 0.0002,
        longitude: baseLng + 0.0001,
      })
      .expect(201);

    expect(res.body.merged).toBe(true);
    expect(res.body.incident.id).toBe(incidentId);
  });

  it("blocks a CITIZEN from verifying an incident (RBAC)", async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/incidents/${incidentId}`)
      .set("Authorization", `Bearer ${citizenToken}`)
      .send({ status: "VERIFIED" })
      .expect(403);
  });

  it("allows an OPERATOR to verify an incident", async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/incidents/${incidentId}`)
      .set("Authorization", `Bearer ${operatorToken}`)
      .send({ status: "VERIFIED" })
      .expect(200);

    expect(res.body.status).toBe("VERIFIED");
    expect(res.body.verifiedAt).not.toBeNull();
  });

  it("exposes the incident as a GeoJSON feature on the map endpoint", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/map/incidents")
      .set("Authorization", `Bearer ${citizenToken}`)
      .expect(200);

    expect(res.body.type).toBe("FeatureCollection");
    expect(res.body.features.some((f: { properties: { id: string } }) => f.properties.id === incidentId)).toBe(
      true,
    );
  });
});
