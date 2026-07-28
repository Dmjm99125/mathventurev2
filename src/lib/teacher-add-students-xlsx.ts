import * as XLSX from 'xlsx';
import {
  parseTeacherStudentsWorksheet,
  type TeacherAddStudentDraft,
} from './teacher-add-students';

export async function parseTeacherStudentsXlsxFile(
  file: File,
): Promise<TeacherAddStudentDraft[]> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

  if (!firstSheet) {
    throw new Error('The workbook is empty.');
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, {
    header: 1,
    blankrows: false,
    defval: '',
  });

  return parseTeacherStudentsWorksheet(rows);
}
