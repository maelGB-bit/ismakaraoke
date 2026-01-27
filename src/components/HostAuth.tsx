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
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer role check with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            checkHostRole(session.user.id);
          }, 0);
        } else {
          setIsHost(false);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkHostRole(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkHostRole = async (userId: string) => {
    try {
      // Check for both 'host' and 'coordinator' roles
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .in('role', ['host', 'coordinator']);

      if (error) {
        console.error('Error checking host role:', error);
        setIsHost(false);
      } else {
        setIsHost(data && data.length > 0);
      }

      // Check if user was forced to logout by admin
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.app_metadata?.session_invalidated) {
        console.log('User session was invalidated by admin, signing out');
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setIsHost(false);
        return;
      }
    } catch (err) {
      console.error('Error checking host role:', err);
      setIsHost(false);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsHost(false);
    navigate('/auth/host');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="animate-pulse-slow">
          <Mic2 className="w-16 h-16 text-primary" />
        </div>
      </div>
    );
  }

  // If not authenticated or not a host, redirect to auth page
  if (!user || !session || !isHost) {
    // Use useEffect pattern would be better, but for now just return loading while redirect happens
    setTimeout(() => {
      navigate('/auth/host');
    }, 100);
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