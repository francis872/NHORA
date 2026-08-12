import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "@nora/types";
import { RolesGuard } from "./roles.guard";

function mockContext(user: { role: Role } | undefined): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe("RolesGuard", () => {
  it("allows access when no roles are required", () => {
    const reflector = { getAllAndOverride: () => undefined } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(mockContext(undefined))).toBe(true);
  });

  it("allows access when the user has one of the required roles", () => {
    const reflector = {
      getAllAndOverride: () => [Role.ADMIN],
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(mockContext({ role: Role.ADMIN }))).toBe(true);
  });

  it("throws ForbiddenException when the user lacks the required role", () => {
    const reflector = {
      getAllAndOverride: () => [Role.ADMIN],
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    expect(() => guard.canActivate(mockContext({ role: Role.CITIZEN }))).toThrow(
      ForbiddenException,
    );
  });
});
