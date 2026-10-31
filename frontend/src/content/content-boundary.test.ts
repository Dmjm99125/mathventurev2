import { describe, expect, it } from 'vitest';
import { lessonContent } from '@content/lessonContent';
import { DEPED_THEMES } from '@content/depedThemes';
import { lessonContent as legacyLessonContent } from '@/data/lessonContent';
import { DEPED_THEMES as legacyDepEdThemes } from '@/data/depedThemes';

describe('content boundary', () => {
  it('preserves the lesson content object identity during migration', () => {
    expect(lessonContent).toBe(legacyLessonContent);
    expect(Object.keys(lessonContent)).toHaveLength(9);
  });

  it('preserves the DepEd theme catalog object identity during migration', () => {
    expect(DEPED_THEMES).toBe(legacyDepEdThemes);
    expect(Object.keys(DEPED_THEMES)).toHaveLength(9);
  });
});
