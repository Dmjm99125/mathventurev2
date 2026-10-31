import { supabase } from '@/lib/supabase/client';

export type AuthClient = {
  functions: Pick<typeof supabase.functions, 'invoke'>;
};

let activeAuthClient: AuthClient = supabase;

export function setActiveAuthClient(client: AuthClient) {
  activeAuthClient = client;
}

export function resetActiveAuthClient() {
  activeAuthClient = supabase;
}

export type InvokeFunctionOptions = {
  method?: 'GET' | 'POST';
  body?: Record<string, unknown>;
  searchParams?: Record<string, string>;
};

// Thin wrapper around supabase.functions.invoke -- every app data operation
// goes through this, which calls a Supabase Edge Function. The browser never
// queries app tables directly.
export async function invokeFunction<T>(
  name: string,
  options?: InvokeFunctionOptions,
  client: AuthClient = activeAuthClient,
): Promise<T> {
  const query = options?.searchParams
    ? `?${new URLSearchParams(options.searchParams).toString()}`
    : '';
  const { data, error } = await client.functions.invoke(`${name}${query}`, {
    method: options?.method ?? 'GET',
    body: options?.body,
  });
  if (error) {
    const message = (error as { context?: { json?: () => Promise<{ error?: string }> } }).context
      ? await (error as any).context.json().then((j: any) => j?.error).catch(() => undefined)
      : undefined;
    throw new Error(message ?? error.message ?? 'Request failed');
  }
  return data as T;
}

export function invokeTeacherFunction<T>(
  name: string,
  options?: InvokeFunctionOptions,
): Promise<T> {
  return invokeFunction<T>(name, options, supabase);
}
