import { Severity } from "@nora/types";
import { computePriority } from "./priority.util";

describe("computePriority", () => {
  it("scores a low-severity report with no aggravating factors as LOW", () => {
    const result = computePriority({ severity: Severity.LOW });
    expect(result.priorityClass).toBe(Severity.LOW);
    expect(result.factors).toContain("Severidad reportada: LOW");
  });

  it("escalates priority class when people are missing or injured", () => {
    const result = computePriority({
      severity: Severity.MEDIUM,
      peopleMissing: 6,
      peopleInjured: 2,
    });
    expect(result.score).toBeGreaterThan(SEVERITY_BASE_MEDIUM);
    expect(result.priorityClass).toBe(Severity.HIGH);
  });

  it("reaches CRITICAL for a high-severity structural incident with corroborating reports", () => {
    const result = computePriority({
      severity: Severity.HIGH,
      peopleAffected: 12,
      infrastructureAffected: "Edificio colapsado",
      corroboratingReports: 4,
    });
    expect(result.priorityClass).toBe(Severity.CRITICAL);
    expect(result.factors).toEqual(
      expect.arrayContaining([
        "12 personas afectadas",
        "Daño estructural / infraestructura afectada reportado",
        "4 reportes coincidentes",
      ]),
    );
  });
});

const SEVERITY_BASE_MEDIUM = 25;
