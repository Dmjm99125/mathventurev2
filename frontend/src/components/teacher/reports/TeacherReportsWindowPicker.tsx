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
    <div
      role="group"
      aria-label="Report time window"
      className="mb-6 flex min-w-0 overflow-x-auto rounded-2xl border border-[var(--teacher-moss)]/20 bg-[var(--teacher-oat)]/30 p-1 gap-1"
    >
      {WINDOWS.map((window) => {
        const active = window.value === value;
        return (
          <button
            key={window.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(window.value)}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
              active
                ? 'bg-[var(--teacher-moss)] text-[var(--teacher-sand)] shadow-sm'
                : 'text-[var(--teacher-ink)]/65 hover:bg-[var(--teacher-sage)]/25 hover:text-[var(--teacher-ink)]'
            }`}
          >
            {window.label}
          </button>
        );
      })}
    </div>
  );
}
