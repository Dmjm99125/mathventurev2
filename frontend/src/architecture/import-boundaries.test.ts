import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), 'src', relativePath), 'utf8');
}

describe('frontend architecture boundaries', () => {
  it('keeps query policy in feature hook modules after facade removal', () => {
    expect(existsSync(resolve(process.cwd(), 'src/lib/api/hooks.ts'))).toBe(false);
    expect(source('features/classroom/api/hooks.ts')).not.toContain('queryKey: [');
    expect(source('features/assignments/api/hooks.ts')).not.toContain('queryKey: [');
  });

  it('keeps game internals outside the feature hook boundaries', () => {
    const featureSources = [
      'features/classroom/api/hooks.ts',
      'features/assignments/api/hooks.ts',
      'features/dashboard/api/hooks.ts',
      'features/reports/api/hooks.ts',
      'features/posts/api/hooks.ts',
    ].map(source).join('\n');

    expect(featureSources).not.toMatch(/components\/games|lib\/games|pages\/games/);
  });

  it('keeps lesson consumers behind the content alias', () => {
    expect(source('pages/QuizPage.tsx')).toContain("from '@content/lessonContent'");
    expect(source('pages/QuizPage.tsx')).toContain("from '@content/depedThemes'");
    expect(source('components/LessonSlideCard.tsx')).toContain("from '@content/lessonContent'");
  });

  it('keeps teacher view models behind the teacher feature boundary', () => {
    expect(source('features/teacher/assignments.tsx')).toContain("from '@features/teacher/model/assignments'");
    expect(source('features/teacher/assignments.tsx')).toContain("from '@features/teacher/model/classes'");
    expect(source('components/teacher/TeacherAssignedQuizzes.tsx'))
      .toContain("from '@features/teacher/model/assignments'");
    expect(source('components/teacher/TeacherClassCard.tsx'))
      .toContain("from '@features/teacher/model/classes'");
  });

  it('keeps migrated public pages out of the legacy page facade', () => {
    const publicPages = source('features/public-site/pages.ts');

    expect(publicPages).not.toContain("from '@/pages/about'");
    expect(publicPages).not.toContain("from '@/pages/auth'");
    expect(publicPages).not.toContain("from '@/pages/landing'");
    expect(publicPages).not.toContain("from '@/pages/not-found'");
    expect(existsSync(resolve(process.cwd(), 'src/pages/about.tsx'))).toBe(false);
    expect(existsSync(resolve(process.cwd(), 'src/pages/auth.tsx'))).toBe(false);
    expect(existsSync(resolve(process.cwd(), 'src/pages/landing.tsx'))).toBe(false);
    expect(existsSync(resolve(process.cwd(), 'src/pages/not-found.tsx'))).toBe(false);
  });

  it('keeps student portal routes out of the legacy student page facade', () => {
    expect(source('features/student/pages.ts')).not.toContain("from '@/pages/student'");
    expect(existsSync(resolve(process.cwd(), 'src/pages/student.tsx'))).toBe(false);
    expect(source('features/student/dashboard.tsx')).not.toMatch(/components\/games|lib\/games|pages\/games/);
    expect(source('features/student/classroom.tsx')).not.toMatch(/components\/games|lib\/games|pages\/games/);
  });

  it('keeps teacher settings out of the legacy teacher page facade', () => {
    expect(source('features/teacher/pages.ts')).not.toContain('TeacherSettingsPage } from \'@/pages/teacher\'');
    expect(source('features/teacher/settings.tsx')).not.toMatch(/components\/games|lib\/games|pages\/games/);
  });

  it('keeps the teacher class list entrypoint in the teacher feature', () => {
    expect(source('features/teacher/pages.ts')).not.toContain('TeacherClassesPage } from \'@/pages/teacher\'');
    expect(source('features/teacher/classes.tsx')).not.toMatch(/components\/games|lib\/games|pages\/games/);
  });

  it('keeps teacher assignments composition in the teacher feature', () => {
    expect(source('features/teacher/pages.ts')).not.toContain('TeacherAssignmentsPage } from \'@/pages/teacher\'');
    expect(source('features/teacher/assignments.tsx')).not.toMatch(/components\/games|lib\/games|pages\/games/);
  });

  it('keeps teacher reports composition in the teacher feature', () => {
    expect(source('features/teacher/pages.ts')).not.toContain('TeacherReportsPage } from \'@/pages/teacher\'');
    expect(source('features/teacher/reports.tsx')).not.toMatch(/components\/games|lib\/games|pages\/games/);
  });

  it('keeps teacher today composition and account actions in the teacher feature', () => {
    expect(source('features/teacher/pages.ts')).not.toContain('TeacherTodayPage } from \'@/pages/teacher\'');
    expect(source('features/teacher/today.tsx')).not.toMatch(/components\/games|lib\/games|pages\/games/);
    expect(source('features/teacher/account-actions.ts')).not.toMatch(/components\/games|lib\/games|pages\/games/);
  });

  it('keeps teacher students composition in the teacher feature', () => {
    expect(source('features/teacher/pages.ts')).not.toContain('TeacherStudentsPage } from \'@/pages/teacher\'');
    expect(source('features/teacher/students.tsx')).not.toMatch(/components\/games|lib\/games|pages\/games/);
  });

  it('keeps the teacher route composition out of the legacy page facade', () => {
    expect(source('features/teacher/pages.ts')).not.toContain("from '@/pages/teacher'");
    expect(source('features/teacher/workspace.tsx')).not.toMatch(/components\/games|lib\/games|pages\/games/);
  });

  it('keeps migrated teacher models out of legacy utility facades', () => {
    expect(existsSync(resolve(process.cwd(), 'src/lib/teacher/assigned-quizzes.ts'))).toBe(false);
    expect(existsSync(resolve(process.cwd(), 'src/lib/teacher/classes.ts'))).toBe(false);
    expect(existsSync(resolve(process.cwd(), 'src/lib/teacher/navigation.ts'))).toBe(false);
    expect(source('components/layout.tsx')).toContain("from '@features/teacher/model/navigation'");
    expect(source('components/teacher/TeacherSidebar.tsx')).toContain("from '@features/teacher/model/navigation'");
  });

  it('keeps student navigation in the student feature model', () => {
    expect(existsSync(resolve(process.cwd(), 'src/lib/student/navigation.ts'))).toBe(false);
    expect(source('components/layout.tsx')).toContain("from '@features/student/model/navigation'");
    expect(source('components/student/StudentShell.tsx')).toContain("from \"@features/student/model/navigation\"");
  });

  it('keeps auth provider ownership in the auth feature', () => {
    expect(source('app/providers.tsx')).toContain("from '@features/auth/provider'");
    expect(source('features/auth/provider.tsx')).not.toMatch(/components\/games|lib\/games|pages\/games/);
  });

  it('keeps language provider ownership in the i18n feature', () => {
    expect(source('app/providers.tsx')).toContain("from '@features/i18n/provider'");
    expect(source('features/i18n/provider.tsx')).not.toMatch(/components\/games|lib\/games|pages\/games/);
  });
});
