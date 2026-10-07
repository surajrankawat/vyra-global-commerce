import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getSupabaseClient, getSupabaseConfig, testSupabaseConnection, fetchServerSupabaseConfig } from '../lib/supabase';
import { fetchUserBusinesses, createBusiness, fetchBusinessMembers } from '../lib/db';
import { Business, UserRole } from '../types';

export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  currentBusiness: Business | null;
  businesses: Business[];
  userRole: UserRole;
  sessionToken: string | null;
  isLoading: boolean;
  loading: boolean;
  isSupabaseMode: boolean;
  isSupabaseConnected: boolean;
  setIsSupabaseConnected: (val: boolean) => void;
  supabaseStatusMessage: string;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password?: string, fullName?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  setCurrentBusiness: (business: Business | null) => void;
  refreshBusinesses: () => Promise<void>;
  refreshBusiness: () => Promise<void>;
  createNewBusiness: (data: Omit<Business, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Business>;
  checkConnection: () => Promise<void>;
  apiFetch: (path: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_USER_KEY = 'ms_nexus_auth_user';
const LOCAL_ACTIVE_BIZ_KEY = 'ms_nexus_active_business_id';
const LOCAL_TOKEN_KEY = 'ms_nexus_session_token';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [userRole, setUserRole] = useState<UserRole>('OWNER');
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSupabaseMode, setIsSupabaseMode] = useState<boolean>(() => getSupabaseConfig().isConfigured);
  const [supabaseStatusMessage, setSupabaseStatusMessage] = useState<string>('');

  const checkConnection = async () => {
    let config = getSupabaseConfig();
    if (!config.isConfigured) {
      const serverConfig = await fetchServerSupabaseConfig();
      if (serverConfig.isConfigured) {
        config = getSupabaseConfig();
      }
    }

    if (config.isConfigured) {
      // Browser-safe Supabase configuration is present! Initialize Supabase mode immediately.
      setIsSupabaseMode(true);
      setSupabaseStatusMessage('Supabase URL & Public API Key configured.');
      
      // Perform diagnostic check in the background for Settings diagnostics
      testSupabaseConnection(config.url, config.anonKey).then((test) => {
        setSupabaseStatusMessage(test.message);
      }).catch((err) => {
        console.warn('Supabase ping check:', err);
      });
    } else {
      setIsSupabaseMode(false);
      setSupabaseStatusMessage('Supabase Config Required: Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to connect.');
    }
  };

  // Determine user role in current business
  useEffect(() => {
    async function determineRole() {
      if (!user || !currentBusiness) {
        setUserRole('OWNER');
        return;
      }
      if (currentBusiness.user_id === user.id || (currentBusiness as any).owner_id === user.id) {
        setUserRole('OWNER');
        return;
      }
      try {
        const members = await fetchBusinessMembers(currentBusiness.id);
        const member = members.find((m) => m.user_id === user.id);
        if (member) {
          setUserRole(member.role);
          return;
        }
      } catch (err) {
        console.warn('Could not determine member role:', err);
      }
      setUserRole('OWNER');
    }

    determineRole();
  }, [user, currentBusiness]);

  useEffect(() => {
    let authListener: { subscription: { unsubscribe: () => void } } | null = null;

    async function initAuth() {
      setIsLoading(true);
      await checkConnection();

      const supabase = getSupabaseClient();
      if (supabase) {
        // Try getting active Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
          };
          setUser(authUser);
          setSessionToken(session.access_token);
          await loadBusinessesForUser(authUser.id);
          setIsLoading(false);
        }

        // Subscribe to auth state updates (session refreshes, password changes)
        const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session?.user) {
            const authUser: AuthUser = {
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            };
            setUser(authUser);
            setSessionToken(session.access_token);
          } else if (!session) {
            setSessionToken(null);
          }
        });
        authListener = listener;

        if (session?.user) return;
      }

      // Check local storage for sandbox session
      const savedUserRaw = localStorage.getItem(LOCAL_USER_KEY);
      const savedToken = localStorage.getItem(LOCAL_TOKEN_KEY);
      if (savedUserRaw) {
        try {
          const parsed = JSON.parse(savedUserRaw) as AuthUser;
          setUser(parsed);
          setSessionToken(savedToken || 'sandbox-token-' + parsed.id);
          await loadBusinessesForUser(parsed.id);
        } catch {
          localStorage.removeItem(LOCAL_USER_KEY);
        }
      }
      setIsLoading(false);
    }

    initAuth();

    return () => {
      if (authListener) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const loadBusinessesForUser = async (userId: string) => {
    try {
      const list = await fetchUserBusinesses(userId);
      setBusinesses(list);

      const savedBizId = localStorage.getItem(LOCAL_ACTIVE_BIZ_KEY);
      const found = list.find((b) => b.id === savedBizId);
      if (found) {
        setCurrentBusiness(found);
      } else if (list.length > 0) {
        setCurrentBusiness(list[0]);
        localStorage.setItem(LOCAL_ACTIVE_BIZ_KEY, list[0].id);
      } else {
        setCurrentBusiness(null);
      }
    } catch (err) {
      console.error('Failed to load businesses:', err);
    }
  };

  const handleSetCurrentBusiness = (biz: Business | null) => {
    setCurrentBusiness(biz);
    if (biz) {
      localStorage.setItem(LOCAL_ACTIVE_BIZ_KEY, biz.id);
    } else {
      localStorage.removeItem(LOCAL_ACTIVE_BIZ_KEY);
    }
  };

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const supabase = getSupabaseClient();
    if (supabase && password) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setIsLoading(false);
        return { success: false, error: error.message };
      }
      if (data.user) {
        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email || email,
          full_name: data.user.user_metadata?.full_name || email.split('@')[0],
        };
        setUser(authUser);
        if (data.session) {
          setSessionToken(data.session.access_token);
        }
        await loadBusinessesForUser(authUser.id);
        setIsLoading(false);
        return { success: true };
      }
    }

    // Local sandbox authentication fallback
    const localId = 'user_' + btoa(email.toLowerCase()).replace(/=/g, '').substring(0, 16);
    const authUser: AuthUser = {
      id: localId,
      email: email.trim().toLowerCase(),
      full_name: email.split('@')[0],
    };
    const localToken = 'sandbox-token-' + localId;
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(authUser));
    localStorage.setItem(LOCAL_TOKEN_KEY, localToken);
    setUser(authUser);
    setSessionToken(localToken);
    await loadBusinessesForUser(authUser.id);
    setIsLoading(false);
    return { success: true };
  };

  const signUp = async (email: string, password?: string, fullName?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const supabase = getSupabaseClient();
    if (supabase && password) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || email.split('@')[0],
          },
        },
      });
      if (error) {
        setIsLoading(false);
        return { success: false, error: error.message };
      }
      if (data.user) {
        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email || email,
          full_name: fullName || data.user.email?.split('@')[0],
        };
        setUser(authUser);
        if (data.session) {
          setSessionToken(data.session.access_token);
        }
        await loadBusinessesForUser(authUser.id);
        setIsLoading(false);
        return { success: true };
      }
    }

    // Local sandbox sign up
    const localId = 'user_' + btoa(email.toLowerCase()).replace(/=/g, '').substring(0, 16);
    const authUser: AuthUser = {
      id: localId,
      email: email.trim().toLowerCase(),
      full_name: fullName || email.split('@')[0],
    };
    const localToken = 'sandbox-token-' + localId;
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(authUser));
    localStorage.setItem(LOCAL_TOKEN_KEY, localToken);
    setUser(authUser);
    setSessionToken(localToken);
    await loadBusinessesForUser(authUser.id);
    setIsLoading(false);
    return { success: true };
  };

  const logout = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase signout warning:', err);
      }
    }
    localStorage.removeItem(LOCAL_USER_KEY);
    localStorage.removeItem(LOCAL_TOKEN_KEY);
    localStorage.removeItem(LOCAL_ACTIVE_BIZ_KEY);
    setUser(null);
    setSessionToken(null);
    setCurrentBusiness(null);
    setBusinesses([]);
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) return { success: false, error: error.message };
      return { success: true };
    }
    return {
      success: true,
      error: 'Password reset email triggered. If using Supabase, check your inbox. In local sandbox mode, password updates apply directly.',
    };
  };

  const refreshBusinesses = async () => {
    if (!user) return;
    await loadBusinessesForUser(user.id);
  };

  const createNewBusiness = async (data: Omit<Business, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Business> => {
    if (!user) throw new Error('User must be logged in to create a business');
    const created = await createBusiness({
      ...data,
      user_id: user.id,
    });
    await refreshBusinesses();
    setCurrentBusiness(created);
    localStorage.setItem(LOCAL_ACTIVE_BIZ_KEY, created.id);
    return created;
  };

  /**
   * Helper to perform authenticated API calls to backend endpoints
   */
  const apiFetch = async (path: string, options: RequestInit = {}): Promise<Response> => {
    const headers = new Headers(options.headers || {});
    if (sessionToken && !sessionToken.startsWith('sandbox-token-')) {
      headers.set('Authorization', `Bearer ${sessionToken}`);
    }
    if (user?.id) {
      headers.set('x-user-id', user.id);
      headers.set('x-user-email', user.email);
    }
    if (currentBusiness?.id) {
      headers.set('x-business-id', currentBusiness.id);
    }
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    return fetch(path, {
      ...options,
      headers,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentBusiness,
        businesses,
        userRole,
        sessionToken,
        isLoading,
        loading: isLoading,
        isSupabaseMode,
        isSupabaseConnected: isSupabaseMode,
        setIsSupabaseConnected: (val: boolean) => setIsSupabaseMode(val),
        supabaseStatusMessage,
        login,
        signUp,
        logout,
        resetPassword,
        setCurrentBusiness: handleSetCurrentBusiness,
        refreshBusinesses,
        refreshBusiness: refreshBusinesses,
        createNewBusiness,
        checkConnection,
        apiFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
