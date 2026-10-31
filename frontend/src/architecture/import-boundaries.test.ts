import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), 'src', relativePath), 'utf8');
}

describe('frontend architecture boundaries', () => {
  it('keeps the legacy API hook import surface as a compatibility barrel', () => {
    const hooks = source('lib/api/hooks.ts');

    expect(hooks).toContain("export * from '@features/classroom/api/hooks';");
    expect(hooks).toContain("export * from '@features/assignments/api/hooks';");
    expect(hooks).not.toContain("queryKey: [");
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
});
