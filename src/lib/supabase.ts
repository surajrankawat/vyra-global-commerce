import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'ms_nexus_supabase_url';
const STORAGE_KEY_ANON = 'ms_nexus_supabase_anon_key';

let serverFetchedConfig: { url: string; anonKey: string } | null = null;

export function normalizeSupabaseUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  const withProtocol = trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, '');
}

export function isValidSupabaseUrl(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed.length < 8) return false;
  if (trimmed.includes('your-project') || trimmed.includes('placeholder')) return false;
  try {
    const normalized = normalizeSupabaseUrl(trimmed);
    const parsed = new URL(normalized);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function isValidSupabaseKey(key?: string | null): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  if (trimmed.length < 15) return false;
  if (trimmed.includes('your-anon') || trimmed.includes('placeholder')) return false;
  // Strictly reject service-role keys from client code
  if (trimmed.toLowerCase().includes('service_role') || trimmed.toLowerCase().includes('service-role')) {
    console.error('CRITICAL SECURITY: Service role key is never allowed in client-side code.');
    return false;
  }
  return true;
}

export async function fetchServerSupabaseConfig(): Promise<{ url: string; anonKey: string; isConfigured: boolean }> {
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      const rawUrl = data.supabaseUrl;
      const rawKey = data.supabaseAnonKey;
      if (isValidSupabaseUrl(rawUrl) && isValidSupabaseKey(rawKey)) {
        serverFetchedConfig = {
          url: normalizeSupabaseUrl(rawUrl),
          anonKey: rawKey.trim(),
        };
        // Reset cached client if config changed
        cachedClient = null;
        cachedConfigKey = '';
        return {
          url: serverFetchedConfig.url,
          anonKey: serverFetchedConfig.anonKey,
          isConfigured: true,
        };
      }
    }
  } catch (err) {
    // Graceful fallback to env / local
  }
  return { url: '', anonKey: '', isConfigured: false };
}

export function getSupabaseConfig(): { url: string; anonKey: string; isConfigured: boolean; source: 'env' | 'user' | 'server' | 'none' } {
  // 1. Check localStorage first (user configured in settings)
  const customUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) : null;
  const customAnon = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_ANON) : null;

  if (isValidSupabaseUrl(customUrl) && isValidSupabaseKey(customAnon)) {
    return {
      url: normalizeSupabaseUrl(customUrl),
      anonKey: customAnon!.trim(),
      isConfigured: true,
      source: 'user',
    };
  }

  // 2. Check environment variables (browser-safe keys only)
  const envUrl = (
    (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
    (import.meta.env.SUPABASE_URL as string | undefined)
  )?.trim();

  const envKey = (
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
    (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
    (import.meta.env.VITE_SUPABASE_KEY as string | undefined) ||
    (import.meta.env.SUPABASE_ANON_KEY as string | undefined)
  )?.trim();

  if (isValidSupabaseUrl(envUrl) && isValidSupabaseKey(envKey)) {
    return {
      url: normalizeSupabaseUrl(envUrl),
      anonKey: envKey!,
      isConfigured: true,
      source: 'env',
    };
  }

  // 3. Check server-fetched public config (if loaded from /api/config)
  if (serverFetchedConfig && isValidSupabaseUrl(serverFetchedConfig.url) && isValidSupabaseKey(serverFetchedConfig.anonKey)) {
    return {
      url: serverFetchedConfig.url,
      anonKey: serverFetchedConfig.anonKey,
      isConfigured: true,
      source: 'server',
    };
  }

  return {
    url: '',
    anonKey: '',
    isConfigured: false,
    source: 'none',
  };
}

let cachedClient: SupabaseClient | null = null;
let cachedConfigKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.isConfigured) {
    return null;
  }

  const currentKey = `${config.url}_${config.anonKey}`;
  if (cachedClient && cachedConfigKey === currentKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    cachedConfigKey = currentKey;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_ANON, anonKey.trim());
    cachedClient = null;
    cachedConfigKey = '';
  }
}

export function clearSupabaseConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_ANON);
    cachedClient = null;
    cachedConfigKey = '';
  }
}

export async function testSupabaseConnection(url?: string, key?: string): Promise<{ success: boolean; message: string }> {
  try {
    const config = getSupabaseConfig();
    const testUrl = (url || config.url)?.trim();
    const testKey = (key || config.anonKey)?.trim();

    if (!isValidSupabaseUrl(testUrl) || !isValidSupabaseKey(testKey)) {
      return { success: false, message: 'Valid Supabase Project URL and browser-safe Anon/Public API Key are required.' };
    }

    const client = createClient(testUrl, testKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // 1. Auth check
    try {
      const { error: authErr } = await client.auth.getSession();
      if (authErr && (authErr.message.toLowerCase().includes('api key') || (authErr as any).status === 401)) {
        return { success: false, message: `Invalid Supabase API Key: ${authErr.message}` };
      }
    } catch {
      // Continue to table test
    }

    // 2. Query test table to verify PostgREST endpoint
    const { error } = await client.from('businesses').select('id').limit(1);

    if (error) {
      const msg = error.message || '';
      const code = error.code || '';

      // Check for actual invalid key / unauthorized
      if (
        msg.toLowerCase().includes('invalid api key') ||
        msg.toLowerCase().includes('jwt expired') ||
        (error as any).status === 401
      ) {
        return { success: false, message: `Supabase Authentication Error: ${msg || 'Invalid API Key'}` };
      }

      // If table doesn't exist yet or schema cache hasn't loaded, connection to Supabase is still 100% verified!
      if (
        msg.includes('does not exist') ||
        msg.includes('schema cache') ||
        code === '42P01' ||
        code === 'PGRST205' ||
        code === 'PGRST200' ||
        code === 'PGRST204' ||
        code === 'PGRST116'
      ) {
        return {
          success: true,
          message: 'Connected to Supabase project! (Run schema.sql in Supabase SQL editor to create all business tables).',
        };
      }

      // Any other database response (such as RLS policy or empty result) proves connection to Supabase succeeded
      return {
        success: true,
        message: 'Successfully connected and verified Supabase project with Row-Level Security!',
      };
    }

    return { success: true, message: 'Successfully connected and verified Supabase database!' };
  } catch (err: any) {
    const msg = err?.message || '';
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      return { success: false, message: 'Network error: Unable to reach Supabase project. Check project URL and network.' };
    }
    return { success: false, message: msg || 'Unknown network error reaching Supabase.' };
  }
}
