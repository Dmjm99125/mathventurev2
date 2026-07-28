import React from 'react';
import { Button, Card, Input, Label } from '@/components/ui';
import {
  normalizeTeacherAddStudentRows,
  type TeacherAddStudentDraft,
} from '@/lib/teacher-add-students';

type EditableRow = TeacherAddStudentDraft & { id: string };

function createEditableRow(seed?: TeacherAddStudentDraft): EditableRow {
  return {
    id: crypto.randomUUID(),
    lastName: seed?.lastName ?? '',
    firstName: seed?.firstName ?? '',
  };
}

export function TeacherAddStudentsManualEditor({
  initialRows,
  onBack,
  onContinue,
}: {
  initialRows: TeacherAddStudentDraft[];
  onBack(): void;
  onContinue(rows: TeacherAddStudentDraft[]): void;
}) {
  const [rows, setRows] = React.useState<EditableRow[]>(
    initialRows.length
      ? initialRows.map((row) => createEditableRow(row))
      : [createEditableRow()],
  );
  const [error, setError] = React.useState<string | null>(null);

  return (
    <Card className="flex flex-1 flex-col rounded-[24px] p-5">
      <div className="space-y-4">
        {rows.map((row) => (
          <div
            key={row.id}
            className="grid gap-3 rounded-2xl border border-border/70 p-4 md:grid-cols-[1fr_1fr_auto]"
          >
            <div className="space-y-2">
              <Label htmlFor={`last-name-${row.id}`}>Last Name</Label>
              <Input
                id={`last-name-${row.id}`}
                value={row.lastName}
                onChange={(event) =>
                  setRows((current) =>
                    current.map((item) =>
                      item.id === row.id
                        ? { ...item, lastName: event.target.value }
                        : item,
                    ),
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`first-name-${row.id}`}>First Name</Label>
              <Input
                id={`first-name-${row.id}`}
                value={row.firstName}
                onChange={(event) =>
                  setRows((current) =>
                    current.map((item) =>
                      item.id === row.id
                        ? { ...item, firstName: event.target.value }
                        : item,
                    ),
                  )
                }
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="ghost"
                disabled={rows.length === 1}
                onClick={() =>
                  setRows((current) =>
                    current.filter((item) => item.id !== row.id),
                  )
                }
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="mt-4 text-sm font-bold text-destructive">{error}</p>}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              setRows((current) => [...current, createEditableRow()])
            }
          >
            + Add Row
          </Button>
          <Button
            onClick={() => {
              try {
                setError(null);
                onContinue(normalizeTeacherAddStudentRows(rows));
              } catch (caught) {
                setError(
                  caught instanceof Error
                    ? caught.message
                    : "We couldn't review those students yet.",
                );
              }
            }}
          >
            Review Students
          </Button>
        </div>
      </div>
    </Card>
  );
}
