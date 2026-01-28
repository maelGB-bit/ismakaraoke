import { useState, useEffect, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface HostAuthProps {
  children: React.ReactNode;
}

interface HostAuthContextType {
  logout: () => Promise<void>;
  user: User | null;
}

const HostAuthContext = createContext<HostAuthContextType | null>(null);

export const useHostAuth = () => {
  const context = useContext(HostAuthContext);
  if (!context) {
    throw new Error('useHostAuth must be used within HostAuth');
  }
  return context;
};

export function HostAuth({ children }: HostAuthProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[HostAuth] Auth state changed:', event, session?.user?.email);
        
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer role check with setTimeout to avoid deadlock
        if (session?.user) {
          // Keep loading while we check the role
          setIsLoading(true);
          setTimeout(() => {
            if (isMounted) {
              checkHostRole(session.user.id);
            }
          }, 0);
        } else {
          setIsHost(false);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      
      console.log('[HostAuth] Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkHostRole(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const checkHostRole = async (userId: string) => {
    try {
      console.log('[HostAuth] Checking role for user:', userId);
      // Check for both 'host' and 'coordinator' roles
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .in('role', ['host', 'coordinator']);

      console.log('[HostAuth] Role check result:', { data, error });

      if (error) {
        console.error('[HostAuth] Error checking host role:', error);
        setIsHost(false);
      } else {
        const hasRole = data && data.length > 0;
        console.log('[HostAuth] Setting isHost to:', hasRole);
        setIsHost(hasRole);
      }
    } catch (err) {
      console.error('[HostAuth] Error checking host role:', err);
      setIsHost(false);
    } finally {
      console.log('[HostAuth] Setting isLoading to false');
      setIsLoading(false);
    }
  };

  const logout = async () => {
    console.log('[HostAuth] Logout initiated');
    
    // Clear local state first - this ensures UI updates immediately
    setUser(null);
    setSession(null);
    setIsHost(false);
    
    try {
      // Use 'local' scope to just clear the local session
      // This avoids 403 errors when session was already invalidated server-side
      await supabase.auth.signOut({ scope: 'local' });
      console.log('[HostAuth] Supabase signOut completed');
    } catch (err) {
      console.error('[HostAuth] Logout error (ignored):', err);
    }
    
    // Explicitly clear all Supabase-related localStorage items
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => {
        console.log('[HostAuth] Removing localStorage key:', key);
        localStorage.removeItem(key);
      });
    } catch (e) {
      console.error('[HostAuth] Error clearing localStorage:', e);
    }
    
    console.log('[HostAuth] Redirecting to /auth/host');
    // Force redirect and reload to ensure clean state
    window.location.href = '/auth/host';
  };

  // Redirect effect - runs when auth state is determined
  useEffect(() => {
    console.log('[HostAuth] Redirect check:', { isLoading, user: user?.email, session: !!session, isHost });
    
    // Only redirect when loading is complete and we know the auth state
    if (!isLoading && (!user || !session || !isHost)) {
      console.log('[HostAuth] Redirecting to /auth/host');
      navigate('/auth/host', { replace: true });
    }
  }, [isLoading, user, session, isHost, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="animate-pulse-slow">
          <Mic2 className="w-16 h-16 text-primary" />
        </div>
      </div>
    );
  }

  // Show loading while redirect happens
  if (!user || !session || !isHost) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="animate-pulse-slow">
          <Mic2 className="w-16 h-16 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <HostAuthContext.Provider value={{ logout, user }}>
      {children}
    </HostAuthContext.Provider>
  );
}