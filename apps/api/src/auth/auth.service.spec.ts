import { Test } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma/prisma.service";

describe("AuthService", () => {
  let authService: AuthService;
  let prisma: {
    user: { findUnique: jest.Mock; create: jest.Mock };
    refreshToken: { create: jest.Mock; findUnique: jest.Mock; update: jest.Mock; updateMany: jest.Mock };
  };

  const baseUser = {
    id: "user-1",
    email: "citizen@example.com",
    fullName: "Test Citizen",
    role: "CITIZEN",
    isActive: true,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    process.env.JWT_ACCESS_SECRET = "test-access-secret";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret";

    prisma = {
      user: { findUnique: jest.fn(), create: jest.fn() },
      refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
  });

  it("registers a new user and returns tokens", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(baseUser);
    prisma.refreshToken.create.mockResolvedValue({});

    const result = await authService.register({
      email: baseUser.email,
      password: "SuperSecret123",
      fullName: baseUser.fullName,
    });

    expect(result.user.email).toBe(baseUser.email);
    expect(result.tokens.accessToken).toBeDefined();
    expect(result.tokens.refreshToken).toBeDefined();
  });

  it("rejects registration when the email already exists", async () => {
    prisma.user.findUnique.mockResolvedValue(baseUser);

    await expect(
      authService.register({
        email: baseUser.email,
        password: "SuperSecret123",
        fullName: baseUser.fullName,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("rejects login with wrong password", async () => {
    prisma.user.findUnique.mockResolvedValue({
      ...baseUser,
      passwordHash: await (await import("bcryptjs")).hash("correct-password", 12),
    });

    await expect(
      authService.login({ email: baseUser.email, password: "wrong-password" }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
