import { Button, Card } from '@/components/ui';
import type { TeacherAddStudentsSource } from '@/lib/teacher-add-students-flow';

const SOURCE_OPTIONS: {
  source: TeacherAddStudentsSource;
  title: string;
  body: string;
}[] = [
  {
    source: 'manual',
    title: 'Manual',
    body: 'Type one or more students, then review before anyone is created.',
  },
  {
    source: 'xlsx',
    title: 'Import XLSX',
    body: 'Upload the strict template with lastName and firstName columns.',
  },
  {
    source: 'json',
    title: 'Import JSON',
    body: 'Upload a strict array of objects with only lastName and firstName.',
  },
];

export function TeacherAddStudentsSourcePicker({
  onSelect,
}: {
  onSelect(source: TeacherAddStudentsSource): void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {SOURCE_OPTIONS.map((option) => (
        <Card key={option.source} className="rounded-[24px] p-5">
          <h3 className="text-lg font-bold">{option.title}</h3>
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            {option.body}
          </p>
          <Button className="mt-5 w-full" onClick={() => onSelect(option.source)}>
            Choose {option.title}
          </Button>
        </Card>
      ))}
    </div>
  );
}
