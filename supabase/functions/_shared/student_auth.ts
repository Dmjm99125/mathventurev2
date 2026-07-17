export const STUDENT_VERIFY_TYPE = "email" as const;

export function normalizeLrn(input: string): string {
  return input.replace(/\D/g, "");
}

export function isValidNormalizedLrn(normalizedLrn: string): boolean {
  return /^\d{12}$/.test(normalizedLrn);
}

export function normalizeClassCode(input: string): string {
  return input.trim().toUpperCase();
}

export function normalizeLastName(input: string): string {
  return input.trim().replace(/\s+/g, " ").toUpperCase();
}

export function studentDisplayName(lastName: string): string {
  return lastName.trim().replace(/\s+/g, " ") || "Student";
}

export function buildStudentEmail(normalizedLrn: string): string {
  return `student.${normalizedLrn}@auth.mathventure.invalid`;
}
