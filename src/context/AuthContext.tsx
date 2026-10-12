import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (phone: string, pass: string) => Promise<any>;
  signUp: (phone: string, pass: string) => Promise<any>;
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

  const formatPhone = (phone: string) => {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    return `+92${cleaned}`;
  };

  const signIn = async (phone: string, password: string) => {
    const formattedPhone = formatPhone(phone);
    const syntheticEmail = `${formattedPhone.replace('+', '')}@appuser.local`;

    // Direct Login using Synthetic Email to bypass Supabase Phone Auth restrictions
    const res = await supabase.auth.signInWithPassword({
      email: syntheticEmail,
      password: password,
    });

    if (res.error) {
      throw new Error(res.error.message);
    }
    return res.data;
  };

  const signUp = async (phone: string, password: string) => {
    const formattedPhone = formatPhone(phone);
    const syntheticEmail = `${formattedPhone.replace('+', '')}@appuser.local`;

    const res = await supabase.auth.signUp({
      email: syntheticEmail,
      password: password,
      options: {
        data: { phone_number: formattedPhone }
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