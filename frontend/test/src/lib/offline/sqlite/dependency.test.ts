import sqlite3InitModule from 'npm:@sqlite.org/sqlite-wasm@3.53.4-build2';

Deno.test('SQLite WASM package is importable by the frontend toolchain', () => {
  if (typeof sqlite3InitModule !== 'function') {
    throw new Error('sqlite3InitModule export is missing');
  }
});
