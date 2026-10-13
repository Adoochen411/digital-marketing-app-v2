import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (username: string, pass: string) => Promise<any>;
  signUp: (username: string, pass: string) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Format username to synthetic email for Supabase Auth
  const getSyntheticEmail = (username: string) => {
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    return `${cleanUsername}@appuser.local`;
  };

  const signIn = async (username: string, password: string) => {
    const syntheticEmail = getSyntheticEmail(username);

    // 1. Try Login
    let res = await supabase.auth.signInWithPassword({
      email: syntheticEmail,
      password: password,
    });

    // 2. Auto Fallback Sign Up if user does not exist yet
    if (res.error) {
      const signUpRes = await supabase.auth.signUp({
        email: syntheticEmail,
        password: password,
        options: {
          data: { username: username.trim() }
        }
      });

      if (signUpRes.error) {
        throw new Error(signUpRes.error.message);
      }

      res = await supabase.auth.signInWithPassword({
        email: syntheticEmail,
        password: password,
      });

      if (res.error) {
        throw new Error(res.error.message);
      }
    }

    return res.data;
  };

  const signUp = async (username: string, password: string) => {
    const syntheticEmail = getSyntheticEmail(username);

    const res = await supabase.auth.signUp({
      email: syntheticEmail,
      password: password,
      options: {
        data: { username: username.trim() }
      }
    });

    if (res.error) {
      throw new Error(res.error.message);
    }
    return res.data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
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