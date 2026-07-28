import { Badge, Button, Card } from '@/components/ui';
import type { TeacherClassSummary } from '@/lib/api';

export function TeacherClassCard({
  klass,
  onEnter,
}: {
  klass: TeacherClassSummary;
  onEnter(): void;
}) {
  return (
    <Card className="flex h-full flex-col justify-between rounded-[28px] p-6 shadow-[0_12px_30px_rgba(58,88,42,0.08)]">
      <div className="space-y-3">
        <h3 className="text-2xl font-display font-bold">{klass.name}</h3>
        <p className="text-sm font-bold text-muted-foreground">{klass.studentCount} students</p>
        <Badge variant="jungle" className="w-fit px-3 py-1 font-mono text-base tracking-[0.22em]">
          {klass.joinCode}
        </Badge>
      </div>
      <Button className="mt-6 self-end" onClick={onEnter}>
        Enter
      </Button>
    </Card>
  );
}
