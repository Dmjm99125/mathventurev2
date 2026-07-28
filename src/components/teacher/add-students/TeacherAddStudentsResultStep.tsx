import { Button, Card } from '@/components/ui';
import type { TeacherAddStudentsResult } from '@/lib/teacher-add-students';

export function TeacherAddStudentsResultStep({
  result,
  onDone,
}: {
  result: TeacherAddStudentsResult;
  onDone(): void;
}) {
  return (
    <Card className="rounded-[24px] p-6">
      <h3 className="text-2xl font-display font-bold">Students Added</h3>
      <p className="mt-3 font-bold text-muted-foreground">
        Added {result.createdCount} student
        {result.createdCount === 1 ? '' : 's'} to {result.className}.
      </p>
      <Button className="mt-6" onClick={onDone}>
        Done
      </Button>
    </Card>
  );
}
