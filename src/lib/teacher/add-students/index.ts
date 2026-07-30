export type TeacherAddStudentDraft = {
  lastName: string;
  firstName: string;
};

export type TeacherAddStudentsResult = {
  classId: string;
  className: string;
  createdCount: number;
};

function cleanStudentCell(value: unknown): string {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

export function normalizeTeacherAddStudentRows(
  rows: { lastName: unknown; firstName: unknown }[],
): TeacherAddStudentDraft[] {
  if (!rows.length) {
    throw new Error('Add at least one student before continuing.');
  }

  return rows.map((row) => {
    const lastName = cleanStudentCell(row.lastName);
    const firstName = cleanStudentCell(row.firstName);

    if (!lastName || !firstName) {
      throw new Error("Every student row needs both Last Name and First Name.");
    }

    return { lastName, firstName };
  });
}

export function parseTeacherStudentsJson(text: string): TeacherAddStudentDraft[] {
  const parsed = JSON.parse(text) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error(
      'Upload a JSON array of objects with only lastName and firstName.',
    );
  }

  const rows = parsed.map((item) => {
    if (!item || Array.isArray(item) || typeof item !== 'object') {
      throw new Error(
        'Upload a JSON array of objects with only lastName and firstName.',
      );
    }

    const record = item as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    if (keys.join(',') !== 'firstName,lastName') {
      throw new Error(
        'Upload a JSON array of objects with only lastName and firstName.',
      );
    }

    return {
      lastName: record.lastName,
      firstName: record.firstName,
    };
  });

  return normalizeTeacherAddStudentRows(rows);
}

export function parseTeacherStudentsWorksheet(
  rows: unknown[][],
): TeacherAddStudentDraft[] {
  if (rows.length < 2) {
    throw new Error('Add at least one student before continuing.');
  }

  const [header, ...dataRows] = rows;
  if (
    (header?.[0] ?? '') !== 'lastName' ||
    (header?.[1] ?? '') !== 'firstName' ||
    header.length !== 2
  ) {
    throw new Error('Use the exact XLSX columns: lastName, firstName.');
  }

  const filteredRows = dataRows.filter((row) =>
    row.some((cell) => cleanStudentCell(cell)),
  );

  return normalizeTeacherAddStudentRows(
    filteredRows.map((row) => ({
      lastName: row[0],
      firstName: row[1],
    })),
  );
}
