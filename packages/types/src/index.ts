// Shared enums and types used by both apps/api and apps/web.
// Keep in sync with database/schema.prisma enums.

export enum Role {
  CITIZEN = "CITIZEN",
  OPERATOR = "OPERATOR",
  ADMIN = "ADMIN",
}

export enum IncidentType {
  EARTHQUAKE = "EARTHQUAKE",
  FLOOD = "FLOOD",
  LANDSLIDE = "LANDSLIDE",
  FIRE = "FIRE",
  STRUCTURAL_DAMAGE = "STRUCTURAL_DAMAGE",
  ROAD_BLOCK = "ROAD_BLOCK",
  MISSING_PERSON = "MISSING_PERSON",
  TRAPPED_PERSON = "TRAPPED_PERSON",
  MEDICAL_ASSISTANCE = "MEDICAL_ASSISTANCE",
  SUPPLY_REQUEST = "SUPPLY_REQUEST",
  OTHER = "OTHER",
}

export enum IncidentStatus {
  REPORTED = "REPORTED",
  PENDING_VERIFICATION = "PENDING_VERIFICATION",
  VERIFIED = "VERIFIED",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
  REJECTED = "REJECTED",
  DUPLICATE = "DUPLICATE",
}

export enum Severity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum AlertType {
  INFO = "INFO",
  WARNING = "WARNING",
  CRITICAL = "CRITICAL",
  EVACUATION = "EVACUATION",
  SYSTEM = "SYSTEM",
}

export enum AlertChannel {
  IN_APP = "IN_APP",
  PUSH = "PUSH",
  EMAIL = "EMAIL",
  SMS = "SMS",
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface PublicUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  createdAt: string;
}
