export const STUDENT_VERIFY_TYPE = "email" as const;

export function normalizeClassCode(input: string): string {
  return input.trim().toUpperCase();
}

function normalizeStudentName(input: string): string {
  return input.trim().replace(/\s+/g, " ").toUpperCase();
}

export function normalizeFirstName(input: string): string {
  return normalizeStudentName(input);
}

export function normalizeLastName(input: string): string {
  return normalizeStudentName(input);
}

function cleanStudentName(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}

export function studentDisplayName(lastName: string, firstName: string): string {
  const cleanLastName = cleanStudentName(lastName);
  const cleanFirstName = cleanStudentName(firstName);
  if (cleanLastName && cleanFirstName) {
    return `${cleanLastName}, ${cleanFirstName}`;
  }
  return cleanLastName || cleanFirstName || "Student";
}

export function buildStudentEmail(studentKey: string): string {
  return `student.${studentKey.trim().toLowerCase()}@auth.mathventure.invalid`;
}
