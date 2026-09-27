export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

export class PaginationInputError extends Error {
  readonly status = 422;

  constructor(message: string) {
    super(message);
    this.name = "PaginationInputError";
  }
}

export function parsePageRequest(url: URL): {
  pageSize: number;
  cursor: string | null;
} {
  const rawPageSize = url.searchParams.get("pageSize");
  const pageSize = rawPageSize === null ? DEFAULT_PAGE_SIZE : Number(rawPageSize);

  if (
    !Number.isInteger(pageSize)
    || pageSize < 1
    || pageSize > MAX_PAGE_SIZE
  ) {
    throw new PaginationInputError(
      `pageSize must be an integer from 1 to ${MAX_PAGE_SIZE}`,
    );
  }

  const rawCursor = url.searchParams.get("cursor");
  return {
    pageSize,
    cursor: rawCursor?.trim() || null,
  };
}

export function encodeCursor(value: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

export function decodeCursor<T>(value: string): T {
  try {
    const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
    const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));

    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Cursor payload must be an object");
    }

    return parsed as T;
  } catch {
    throw new PaginationInputError("cursor is invalid");
  }
}
