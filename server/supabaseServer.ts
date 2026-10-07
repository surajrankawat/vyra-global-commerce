import { createClient, SupabaseClient } from '@supabase/supabase-js';

let anonServerClient: SupabaseClient | null = null;
let adminServerClient: SupabaseClient | null = null;

function getSupabaseUrl(): string | undefined {
  const url = process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim();
  if (!url || url.includes('your-project')) return undefined;
  return url;
}

function getSupabaseAnonKey(): string | undefined {
  const key = process.env.SUPABASE_ANON_KEY?.trim() ||
              process.env.VITE_SUPABASE_ANON_KEY?.trim() ||
              process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
              process.env.VITE_SUPABASE_KEY?.trim();
  if (!key || key.includes('your-anon') || key.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')) return undefined;
  return key;
}

function getSupabaseServiceRoleKey(): string | undefined {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key || key.length < 10) return undefined;
  return key;
}

/**
 * Server-side Supabase client resolver:
 * - If userToken is provided, creates/returns a client scoped to the authenticated user using the anon key + Bearer token (enforces RLS).
 * - If SUPABASE_SERVICE_ROLE_KEY is present and no userToken is provided, uses service role for administrative bypass.
 * - Otherwise falls back to standard public anon key.
 */
export function getSupabaseServerClient(userToken?: string): SupabaseClient | null {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!url) return null;

  // 1. User-scoped client with RLS enforcement (requires only anon key + user Bearer token)
  if (userToken && anonKey) {
    const cleanToken = userToken.startsWith('Bearer ') ? userToken.substring(7).trim() : userToken.trim();
    if (cleanToken) {
      return createClient(url, anonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${cleanToken}`,
          },
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
  }

  // 2. Server admin client (if SUPABASE_SERVICE_ROLE_KEY is explicitly configured for administrative bypass)
  if (serviceRoleKey) {
    if (adminServerClient) return adminServerClient;
    try {
      adminServerClient = createClient(url, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
      return adminServerClient;
    } catch (err) {
      console.error('Failed to initialize Supabase admin client:', err);
    }
  }

  // 3. Browser-safe anon client fallback
  if (anonKey) {
    if (anonServerClient) return anonServerClient;
    try {
      anonServerClient = createClient(url, anonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
      return anonServerClient;
    } catch (err) {
      console.error('Failed to initialize server anon Supabase client:', err);
    }
  }

  return null;
}

export interface AuthContextResult {
  user: {
    id: string;
    email: string;
    full_name?: string;
  } | null;
  error?: string;
}

/**
 * Authenticates user from Bearer token using browser-safe public anon key (or service role if available)
 */
export async function authenticateToken(authHeader?: string): Promise<AuthContextResult> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Authorization header missing or malformed' };
  }

  const token = authHeader.split(' ')[1]?.trim();
  if (!token) {
    return { user: null, error: 'Bearer token missing' };
  }

  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey() || getSupabaseServiceRoleKey();
  if (!url || !key) {
    return { user: null, error: 'Database authentication service unconfigured' };
  }

  try {
    const client = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    const { data: { user }, error } = await client.auth.getUser(token);
    if (error || !user) {
      return { user: null, error: error?.message || 'Invalid or expired session token' };
    }

    return {
      user: {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
      },
    };
  } catch (err: any) {
    return { user: null, error: err.message || 'Authentication error' };
  }
}

/**
 * Verifies that a user belongs to a business with the required role
 */
export async function verifyBusinessMembership(
  userId: string,
  businessId: string,
  requiredRoles?: string[],
  userToken?: string
): Promise<{ authorized: boolean; role?: string; error?: string }> {
  const supabase = getSupabaseServerClient(userToken);
  if (!supabase) {
    return { authorized: false, error: 'Database service not available' };
  }

  try {
    // 1. Check if user is owner of business directly
    const { data: business, error: bizErr } = await supabase
      .from('businesses')
      .select('id, user_id, owner_id')
      .eq('id', businessId)
      .single();

    if (business && (business.user_id === userId || business.owner_id === userId)) {
      return { authorized: true, role: 'OWNER' };
    }

    // 2. Check business_members
    const { data: member, error: memberErr } = await supabase
      .from('business_members')
      .select('role, status')
      .eq('business_id', businessId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (memberErr || !member) {
      return { authorized: false, error: 'User does not belong to this business' };
    }

    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(member.role)) {
        return {
          authorized: false,
          role: member.role,
          error: `Access denied. Required role: ${requiredRoles.join(' or ')}. Your role: ${member.role}`,
        };
      }
    }

    return { authorized: true, role: member.role };
  } catch (err: any) {
    return { authorized: false, error: err.message || 'Authorization check failed' };
  }
}

/**
 * Records an immutable audit log entry
 */
export async function recordAuditLog(params: {
  businessId: string;
  userId?: string;
  userEmail?: string;
  action: string;
  entityType: string;
  entityId?: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
}): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  try {
    // Strip sensitive fields from metadata if any
    const cleanMeta = { ...params.metadata };
    delete cleanMeta.password;
    delete cleanMeta.token;
    delete cleanMeta.secret;
    delete cleanMeta.card_number;

    await supabase.from('audit_logs').insert({
      business_id: params.businessId,
      user_id: params.userId,
      user_email: params.userEmail,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId,
      description: params.description,
      metadata: cleanMeta,
      ip_address: params.ipAddress,
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
