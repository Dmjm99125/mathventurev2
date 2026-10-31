import { describe, expect, it } from 'vitest';
import { cn } from '@shared/utils';

describe('cn', () => {
  it('merges conditional and conflicting Tailwind classes', () => {
    expect(cn('rounded-md', false && 'hidden', 'p-2', 'p-4')).toBe('rounded-md p-4');
  });
});
