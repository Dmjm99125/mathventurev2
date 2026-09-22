import React from 'react';
import { Button, Card, Input } from '@/components/ui';
import {
  parseTeacherStudentsJson,
  type TeacherAddStudentDraft,
} from '@/lib/teacher/add-students';
import { parseTeacherStudentsXlsxFile } from '@/lib/teacher/add-students/xlsx';

export function TeacherAddStudentsImportStep({
  source,
  onBack,
  onContinue,
}: {
  source: 'xlsx' | 'json';
  onBack(): void;
  onContinue(rows: TeacherAddStudentDraft[]): void;
}) {
  const [error, setError] = React.useState<string | null>(null);

  const parseFile = async (file: File) => {
    if (source === 'xlsx') {
      return parseTeacherStudentsXlsxFile(file);
    }

    return parseTeacherStudentsJson(await file.text());
  };

  return (
    <Card className="rounded-[24px] p-5">
      <p className="text-sm font-bold text-muted-foreground">
        {source === 'xlsx'
          ? 'Upload one .xlsx file with the exact columns: lastName, firstName.'
          : 'Upload one .json file with a strict array of objects containing only lastName and firstName.'}
      </p>

      <Input
        className="mt-4"
        type="file"
        accept={source === 'xlsx' ? '.xlsx' : '.json,application/json'}
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) {
            return;
          }

          try {
            setError(null);
            onContinue(await parseFile(file));
          } catch (caught) {
            setError(
              caught instanceof Error
                ? caught.message
                : "We couldn't parse that file.",
            );
          } finally {
            event.target.value = '';
          }
        }}
      />

      {error && <p className="mt-4 text-sm font-bold text-destructive">{error}</p>}

      <Button className="mt-5" variant="ghost" onClick={onBack}>
        Back
      </Button>
    </Card>
  );
}
