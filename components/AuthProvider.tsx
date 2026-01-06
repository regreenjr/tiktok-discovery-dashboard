'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';

let supabaseClient: SupabaseClient | null = null;
let configPromise: Promise<{supabaseUrl: string; supabaseAnonKey: string}> | null = null;

async function getConfig() {
  if (!configPromise) {
    configPromise = fetch('/api/config').then(r => r.json());
  }
  return configPromise;
}

async function getSupabaseClient() {
  if (!supabaseClient) {
    const config = await getConfig();

    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      console.error('Missing Supabase configuration from API');
      throw new Error('Supabase configuration is missing.');
    }

    supabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey);
  }
  return supabaseClient;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let subscription: any;

    getSupabaseClient().then(supabase => {
      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Redirect to login if not authenticated and not on login page
        if (!session && pathname !== '/login') {
          router.push('/login');
        }
      });

      // Listen for auth changes
      const {
        data: { subscription: sub },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Redirect based on auth state
        if (!session && pathname !== '/login') {
          router.push('/login');
        } else if (session && pathname === '/login') {
          router.push('/');
        }
      });

      subscription = sub;
    });

    return () => subscription?.unsubscribe();
  }, [router, pathname]);

  const signOut = async () => {
    const supabase = await getSupabaseClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
