import { SQLITE_SCHEMA_VERSION } from './migrations.ts';

export type SqliteValue = string | number | null | Uint8Array;
export type SqliteParams = readonly SqliteValue[];
export type SqliteRow = Record<string, unknown>;

export interface SqliteTransaction {
  query<T extends SqliteRow = SqliteRow>(sql: string, params?: SqliteParams): Promise<T[]>;
  execute(sql: string, params?: SqliteParams): Promise<void>;
}

export interface SqliteDatabase extends SqliteTransaction {
  transaction<T>(work: (transaction: SqliteTransaction) => Promise<T>): Promise<T>;
  health(): Promise<{ schemaVersion: number; durable: boolean }>;
  close(): Promise<void>;
}

export class SqliteStorageError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'SqliteStorageError';
  }
}

export const EMPTY_SQLITE_HEALTH = {
  schemaVersion: SQLITE_SCHEMA_VERSION,
  durable: false,
} as const;
