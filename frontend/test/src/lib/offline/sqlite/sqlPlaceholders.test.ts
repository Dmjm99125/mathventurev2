import { assertEquals } from 'jsr:@std/assert';
import { normalizeSqlitePlaceholders } from '../../../../../src/lib/offline/sqlite/sqlPlaceholders.ts';

Deno.test('normalizes executable question-mark placeholders', () => {
  assertEquals(
    normalizeSqlitePlaceholders('select * from users where id = ? and role = ?'),
    'select * from users where id = $1 and role = $2',
  );
});

Deno.test('preserves question marks in strings and comments', () => {
  assertEquals(
    normalizeSqlitePlaceholders("select '?' as literal /* ? */ from users where id = ? -- ?"),
    "select '?' as literal /* ? */ from users where id = $1 -- ?",
  );
});
