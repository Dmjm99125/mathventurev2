import { describe, expect, it } from 'vitest';
import { useRecordFreePlayCompletion } from './hooks';

describe('progress hook boundary', () => {
  it('exposes free-play persistence through a non-game feature module', () => {
    expect(useRecordFreePlayCompletion).toEqual(expect.any(Function));
  });
});
