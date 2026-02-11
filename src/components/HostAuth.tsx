import { useState, useEffect, useRef, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

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
  
  // Track if user explicitly logged out vs transient session loss
  const explicitLogoutRef = useRef(false);
  // Track if we ever had a valid session (to distinguish initial load from session loss)
  const hadSessionRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session) => {
        console.log('[HostAuth] Auth state changed:', event, session?.user?.email);
        
        if (!isMounted) return;
        
        // SIGNED_OUT can be triggered by token refresh failures
        // Only treat as real logout if it was explicitly initiated
        if (event === 'SIGNED_OUT') {
          if (explicitLogoutRef.current) {
            // Real logout - clear everything
            setSession(null);
            setUser(null);
            setIsHost(false);
            setIsLoading(false);
            return;
          }
          
          // Token refresh failure - try to recover session
          console.log('[HostAuth] Possible token refresh failure, attempting recovery...');
          setTimeout(async () => {
            if (!isMounted) return;
            try {
              const { data } = await supabase.auth.getSession();
              if (data.session) {
                console.log('[HostAuth] Session recovered successfully');
                setSession(data.session);
                setUser(data.session.user);
                checkHostRole(data.session.user.id);
              } else {
                console.log('[HostAuth] Session truly expired, redirecting');
                setSession(null);
                setUser(null);
                setIsHost(false);
                setIsLoading(false);
              }
            } catch (err) {
              console.error('[HostAuth] Recovery failed:', err);
              setSession(null);
              setUser(null);
              setIsHost(false);
              setIsLoading(false);
            }
          }, 1000);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          hadSessionRef.current = true;
          setIsLoading(true);
          setTimeout(() => {
            if (isMounted) {
              checkHostRole(session.user.id);
            }
          }, 0);
        } else if (!hadSessionRef.current) {
          // Never had a session - initial load with no auth
          setIsHost(false);
          setIsLoading(false);
        }
        // If hadSession but now null and not explicit logout, 
        // wait for recovery attempt (handled above for SIGNED_OUT)
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      
      console.log('[HostAuth] Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        hadSessionRef.current = true;
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
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .in('role', ['host', 'coordinator']);

      console.log('[HostAuth] Role check result:', { data, error });

      if (error) {
        // If it's a network/auth error and we had a session, don't immediately kick out
        console.error('[HostAuth] Error checking host role:', error);
        if (hadSessionRef.current && (error.message?.includes('JWT') || error.code === 'PGRST301')) {
          console.log('[HostAuth] Auth error during role check, attempting token refresh...');
          const { data: refreshData } = await supabase.auth.refreshSession();
          if (refreshData.session) {
            // Retry role check with refreshed token
            const { data: retryData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', userId)
              .in('role', ['host', 'coordinator']);
            setIsHost(!!(retryData && retryData.length > 0));
            return;
          }
        }
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
      setIsLoading(false);
    }
  };

  const logout = async () => {
    console.log('[HostAuth] Logout initiated');
    
    // Mark as explicit logout BEFORE clearing state
    explicitLogoutRef.current = true;
    
    setUser(null);
    setSession(null);
    setIsHost(false);
    
    try {
      await supabase.auth.signOut({ scope: 'local' });
      console.log('[HostAuth] Supabase signOut completed');
    } catch (err) {
      console.error('[HostAuth] Logout error (ignored):', err);
    }
    
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (e) {
      console.error('[HostAuth] Error clearing localStorage:', e);
    }
    
    console.log('[HostAuth] Redirecting to /app/login');
    window.location.href = '/app/login';
  };

  // Redirect effect - only when truly not authenticated
  useEffect(() => {
    console.log('[HostAuth] Redirect check:', { isLoading, user: user?.email, session: !!session, isHost });
    
    if (!isLoading && (!user || !session || !isHost)) {
      // Don't redirect if we're in recovery mode (had session, not explicit logout)
      if (hadSessionRef.current && !explicitLogoutRef.current) {
        console.log('[HostAuth] Session lost but not explicit logout, waiting for recovery...');
        return;
      }
      console.log('[HostAuth] Redirecting to /app/auth/host');
      navigate('/app/auth/host', { replace: true });
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
