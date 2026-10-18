import { Link } from 'wouter';
import { Archive, ArchiveRestore, Pencil, Users } from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
import type { TeacherClassSummary } from '@/lib/api';
import { teacherClassPath, isArchivedClass } from '@/lib/teacher/classes';

export function TeacherClassCard({
  classroom,
  online,
  onRename,
  onArchive,
  onUnarchive,
}: {
  classroom: TeacherClassSummary;
  online: boolean;
  onRename(): void;
  onArchive(): void;
  onUnarchive(): void;
}) {
  const archived = isArchivedClass(classroom);

  return (
    <Card className="group flex min-h-[13rem] flex-col justify-between border-[var(--teacher-moss)]/20 bg-[var(--teacher-oat)]/55 p-6 shadow-none transition-transform hover:-translate-y-0.5">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="teacher-eyebrow">{archived ? 'Archived class' : 'Active class'}</p>
            <h3 className="mt-2 truncate font-display text-2xl font-bold text-[var(--teacher-ink)]">{classroom.name}</h3>
          </div>
          {archived && <Badge variant="secondary">Archived</Badge>}
        </div>
        <div className="mt-6 flex flex-wrap gap-4 text-sm font-semibold text-[var(--teacher-ink)]/70">
          <span className="inline-flex items-center gap-2"><Users className="h-4 w-4" />{classroom.studentCount} students</span>
          <span>Created {new Date(classroom.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild size="sm" className="bg-[var(--teacher-terracotta)] text-[var(--teacher-sand)] hover:bg-[var(--teacher-terracotta)]/90">
          <Link href={teacherClassPath(classroom.id)}>Open class</Link>
        </Button>
        {online && !archived && <Button type="button" size="sm" variant="outline" className="border-[var(--teacher-moss)]/30 text-[var(--teacher-ink)]" onClick={onRename}>
          <Pencil className="mr-2 h-4 w-4" />Rename
        </Button>}
        {online && (archived ? (
          <Button type="button" size="sm" variant="ghost" className="text-[var(--teacher-ink)]" onClick={onUnarchive}>
            <ArchiveRestore className="mr-2 h-4 w-4" />Unarchive
          </Button>
        ) : (
          <Button type="button" size="sm" variant="ghost" className="text-[var(--teacher-ink)]" onClick={onArchive}>
            <Archive className="mr-2 h-4 w-4" />Archive
          </Button>
        ))}
      </div>
    </Card>
  );
}
