type ScannerState = 'normal' | 'single-quote' | 'double-quote' | 'backtick' | 'line-comment' | 'block-comment';

export function normalizeSqlitePlaceholders(sql: string): string {
  let state: ScannerState = 'normal';
  let parameterIndex = 0;
  let normalized = '';

  for (let index = 0; index < sql.length; index += 1) {
    const character = sql[index];
    const next = sql[index + 1];

    if (state === 'normal') {
      if (character === "'") state = 'single-quote';
      else if (character === '"') state = 'double-quote';
      else if (character === '`') state = 'backtick';
      else if (character === '-' && next === '-') {
        normalized += '--';
        index += 1;
        state = 'line-comment';
        continue;
      } else if (character === '/' && next === '*') {
        normalized += '/*';
        index += 1;
        state = 'block-comment';
        continue;
      } else if (character === '?') {
        parameterIndex += 1;
        normalized += `$${parameterIndex}`;
        continue;
      }
      normalized += character;
      continue;
    }

    normalized += character;
    if (state === 'line-comment') {
      if (character === '\n' || character === '\r') state = 'normal';
      continue;
    }
    if (state === 'block-comment') {
      if (character === '*' && next === '/') {
        normalized += '/';
        index += 1;
        state = 'normal';
      }
      continue;
    }

    const quote = state === 'single-quote' ? "'" : state === 'double-quote' ? '"' : '`';
    if (character !== quote) continue;
    if (next === quote) {
      normalized += next;
      index += 1;
    } else {
      state = 'normal';
    }
  }

  return normalized;
}
