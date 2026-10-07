import type { OfflineEntityName } from './types.ts';
import type { OfflineRecord, OfflineStore } from './store.ts';

const storeNames: OfflineEntityName[] = [
  'profiles',
  'classrooms',
  'classStudents',
  'assignments',
  'attempts',
  'attemptGameResults',
  'posts',
  'outbox',
  'conflicts',
  'meta',
];

function clone<T>(value: T): T {
  return structuredClone(value);
}

export function createMemoryStore(): OfflineStore {
  const records = new Map<OfflineEntityName, Map<string, OfflineRecord>>(
    storeNames.map((name) => [name, new Map<string, OfflineRecord>()]),
  );

  function getStore(name: OfflineEntityName) {
    const store = records.get(name);
    if (!store) throw new Error(`Unknown offline store: ${name}`);
    return store;
  }

  return {
    async get(name, key) {
      const record = getStore(name).get(key);
      return record ? clone(record) : undefined;
    },
    async put(name, record) {
      getStore(name).set(record.key, clone(record));
    },
    async delete(name, key) {
      getStore(name).delete(key);
    },
    async getAll(name) {
      return Array.from(getStore(name).values(), clone);
    },
    async transaction(_stores, work) {
      return work();
    },
  };
}
