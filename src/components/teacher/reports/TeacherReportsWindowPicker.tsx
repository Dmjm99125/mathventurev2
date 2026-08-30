import { Button } from '@/components/ui';
import type { TeacherReportsWindowKey } from '@/lib/teacher/reports';

const WINDOWS: { value: TeacherReportsWindowKey; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'quarter', label: 'This quarter' },
  { value: 'all', label: 'All time' },
];

export function TeacherReportsWindowPicker({
  value,
  onChange,
}: {
  value: TeacherReportsWindowKey;
  onChange(window: TeacherReportsWindowKey): void;
}) {
  return (
    <div className="mb-6 flex min-w-0 flex-wrap gap-2">
      {WINDOWS.map((window) => (
        <Button
          key={window.value}
          className="shrink-0"
          variant={window.value === value ? 'default' : 'outline'}
          onClick={() => onChange(window.value)}
        >
          {window.label}
        </Button>
      ))}
    </div>
  );
}
