import { Severity } from "@nora/types";

// Deterministic priority scoring (Phase 2). This is NOT the ML model from
// section 15/16 — that lands in Phase 5 and will replace/augment this with a
// trained classifier. Kept simple, explainable, and testable per section 17.
export interface PriorityInput {
  severity: Severity;
  peopleAffected?: number | null;
  peopleMissing?: number | null;
  peopleInjured?: number | null;
  infrastructureAffected?: string | null;
  corroboratingReports?: number;
}

export interface PriorityResult {
  score: number;
  priorityClass: Severity;
  factors: string[];
}

const SEVERITY_BASE: Record<Severity, number> = {
  [Severity.LOW]: 10,
  [Severity.MEDIUM]: 25,
  [Severity.HIGH]: 50,
  [Severity.CRITICAL]: 80,
};

export function computePriority(input: PriorityInput): PriorityResult {
  const factors: string[] = [];
  let score = SEVERITY_BASE[input.severity];
  factors.push(`Severidad reportada: ${input.severity}`);

  if (input.peopleAffected) {
    score += input.peopleAffected * 1;
    factors.push(`${input.peopleAffected} personas afectadas`);
  }
  if (input.peopleMissing) {
    score += input.peopleMissing * 4;
    factors.push(`${input.peopleMissing} personas desaparecidas`);
  }
  if (input.peopleInjured) {
    score += input.peopleInjured * 3;
    factors.push(`${input.peopleInjured} personas heridas`);
  }
  if (input.infrastructureAffected) {
    score += 10;
    factors.push("Daño estructural / infraestructura afectada reportado");
  }
  if (input.corroboratingReports) {
    score += input.corroboratingReports * 5;
    factors.push(`${input.corroboratingReports} reportes coincidentes`);
  }

  let priorityClass: Severity;
  if (score >= 80) priorityClass = Severity.CRITICAL;
  else if (score >= 50) priorityClass = Severity.HIGH;
  else if (score >= 25) priorityClass = Severity.MEDIUM;
  else priorityClass = Severity.LOW;

  return { score, priorityClass, factors };
}
