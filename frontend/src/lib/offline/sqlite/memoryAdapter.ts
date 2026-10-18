import { SQLITE_MIGRATIONS, SQLITE_SCHEMA_VERSION } from './migrations.ts';
import type { SqliteDatabase, SqliteParams, SqliteRow, SqliteTransaction } from './adapter.ts';

type TableState = Map<string, SqliteRow>;
type DatabaseState = Map<string, TableState>;

function clone<T>(value: T): T {
  return structuredClone(value);
}

function normalizedSql(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim();
}

function tableKey(table: string, row: SqliteRow, fallback: number): string {
  for (const candidate of ['key', 'operation_id', 'conflict_id', 'id', 'version']) {
    const value = row[candidate];
    if (typeof value === 'string' || typeof value === 'number') return String(value);
  }
  return `${table}:${fallback}`;
}

function requireTable(state: DatabaseState, name: string): TableState {
  const table = state.get(name);
  if (!table) throw new Error(`Table ${name} does not exist.`);
  return table;
}

function createTablesFromSchema(state: DatabaseState): void {
  for (const migration of SQLITE_MIGRATIONS) {
    for (const statement of migration.statements) {
      const match = /^create table if not exists ([a-z_]+)/i.exec(normalizedSql(statement));
      if (match && !state.has(match[1])) state.set(match[1], new Map());
    }
  }
}

function parameterValues(params: SqliteParams | undefined): SqliteValue[] {
  return [...(params ?? [])];
}

type SqliteValue = string | number | null | Uint8Array;

function executeSql(state: DatabaseState, rawSql: string, params?: SqliteParams): void {
  const sql = normalizedSql(rawSql);
  if (!sql || /^create index /i.test(sql) || /^create table /i.test(sql)) return;

  const insert = /^insert into ([a-z_]+)\s*\(([^)]+)\) values \(([^)]+)\)/i.exec(sql);
  if (insert) {
    const tableName = insert[1];
    const table = requireTable(state, tableName);
    const columns = insert[2].split(',').map((column) => column.trim());
    const values = parameterValues(params);
    const row: SqliteRow = {};
    columns.forEach((column, index) => { row[column] = clone(values[index] ?? null); });
    table.set(tableKey(tableName, row, table.size), row);
    return;
  }

  const update = /^update ([a-z_]+) set (.+?) where (.+)$/i.exec(sql);
  if (update) {
    const table = requireTable(state, update[1]);
    const assignments = update[2].split(',').map((assignment) => assignment.trim().split(/\s*=\s*/)[0]);
    const where = parseWhere(update[3], params ?? [], assignments.length);
    for (const row of table.values()) {
      if (!matchesWhere(row, where.conditions)) continue;
      assignments.forEach((column, index) => { row[column] = clone(parameterValues(params)[index] ?? null); });
    }
    return;
  }

  const deletion = /^delete from ([a-z_]+)(?: where (.+))?$/i.exec(sql);
  if (deletion) {
    const table = requireTable(state, deletion[1]);
    const where = parseWhere(deletion[2] ?? '', params ?? [], 0);
    for (const [key, row] of table.entries()) {
      if (!where.conditions.length || matchesWhere(row, where.conditions)) table.delete(key);
    }
    return;
  }

  throw new Error(`Memory SQLite adapter does not support execute SQL: ${sql}`);
}

type WhereCondition = { column: string; value: SqliteValue };

function parseWhere(whereSql: string, params: SqliteParams, paramOffset: number): { conditions: WhereCondition[] } {
  if (!whereSql.trim()) return { conditions: [] };
  const conditions: WhereCondition[] = [];
  let parameterIndex = paramOffset;
  for (const part of whereSql.split(/\s+and\s+/i)) {
    const match = /^([a-z_]+)\s*=\s*\?$/i.exec(part.trim());
    if (!match) throw new Error(`Memory SQLite adapter does not support WHERE clause: ${whereSql}`);
    conditions.push({ column: match[1], value: params[parameterIndex] ?? null });
    parameterIndex += 1;
  }
  return { conditions };
}

function matchesWhere(row: SqliteRow, conditions: readonly WhereCondition[]): boolean {
  return conditions.every(({ column, value }) => row[column] === value);
}

async function querySql<T extends SqliteRow>(state: DatabaseState, rawSql: string, params?: SqliteParams): Promise<T[]> {
  const sql = normalizedSql(rawSql);
  const select = /^select (.+?) from ([a-z_]+)(?: where (.*?))?(?: order by ([a-z_]+)(?: (asc|desc))?)?(?: limit (\d+))?$/i.exec(sql);
  if (!select) throw new Error(`Memory SQLite adapter does not support query SQL: ${sql}`);

  const columnsText = select[1];
  const table = requireTable(state, select[2]);
  const where = parseWhere(select[3] ?? '', params ?? [], 0);
  let rows = [...table.values()].filter((row) => matchesWhere(row, where.conditions));
  if (select[4]) {
    const column = select[4];
    const direction = select[5]?.toLowerCase() === 'desc' ? -1 : 1;
    rows.sort((left, right) => String(left[column] ?? '').localeCompare(String(right[column] ?? '')) * direction);
  }
  if (select[6]) rows = rows.slice(0, Number(select[6]));
  if (columnsText.trim() === '*') return rows.map(clone) as T[];
  const columns = columnsText.split(',').map((column) => column.trim());
  return rows.map((row) => Object.fromEntries(columns.map((column) => [column, clone(row[column] ?? null)]))) as T[];
}

function transactionFor(state: DatabaseState): SqliteTransaction {
  return {
    execute: async (sql, params) => executeSql(state, sql, params),
    query: async <T extends SqliteRow = SqliteRow>(sql: string, params?: SqliteParams) => querySql<T>(state, sql, params),
  };
}

export async function createMemorySqlite(): Promise<SqliteDatabase> {
  const state: DatabaseState = new Map();
  createTablesFromSchema(state);

  const database: SqliteDatabase = {
    execute: async (sql, params) => executeSql(state, sql, params),
    query: async <T extends SqliteRow = SqliteRow>(sql: string, params?: SqliteParams) => querySql<T>(state, sql, params),
    transaction: async <T>(work: (transaction: SqliteTransaction) => Promise<T>) => {
      const snapshot = clone(state);
      try {
        return await work(transactionFor(state));
      } catch (error) {
        state.clear();
        for (const [tableName, rows] of snapshot.entries()) state.set(tableName, rows);
        throw error;
      }
    },
    health: async () => ({ schemaVersion: SQLITE_SCHEMA_VERSION, durable: false, quality: 'unknown' as const }),
    close: async () => {},
  };

  return database;
}
