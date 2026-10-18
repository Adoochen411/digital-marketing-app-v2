import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Session loading error:', error.message);
        }

        if (mounted) {
          setUser(data.session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Session loading error:', error);

        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Purane username-based accounts ka email format.
  const getSyntheticEmail = (username: string): string => {
    const cleanUsername = username.trim().toLowerCase();

    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      throw new Error(
        'Username mein sirf English letters, numbers aur underscore (_) use karein.'
      );
    }

    return `${cleanUsername}@appuser.local`;
  };

  // LOGIN: Admin email ko seedha Supabase Auth par bhejein.
  // Customers username ya email se login kar sakte hain.
  const signIn = async (username: string, password: string) => {
    const loginValue = username.trim();

    if (!loginValue || !password) {
      throw new Error('Admin email/username aur password enter karein.');
    }

    let loginEmail: string;

    if (loginValue.includes('@')) {
      // Email login: admin aur email-based customers.
      loginEmail = loginValue.toLowerCase();
    } else {
      // Username login: registered profile ka email dhoondein.
      const { data: profile, error: lookupError } = await supabase
        .from('profiles')
        .select('email')
        .ilike('username', loginValue)
        .maybeSingle();

      if (!lookupError && profile?.email) {
        loginEmail = profile.email.trim().toLowerCase();
      } else {
        // Legacy username-based accounts.
        loginEmail = getSyntheticEmail(loginValue);
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (error) {
      console.error('Supabase login error:', error.message);
      throw new Error(error.message);
    }

    return data;
  };

  // SIGNUP: Sirf username-based accounts ke liye.
  // Existing profile ko overwrite nahi karta.
  const signUp = async (username: string, password: string) => {
    const cleanUsername = username.trim();
    const syntheticEmail = getSyntheticEmail(cleanUsername);

    if (password.length < 6) {
      throw new Error('Password kam az kam 6 characters ka hona chahiye.');
    }

    const { data, error } = await supabase.auth.signUp({
      email: syntheticEmail,
      password,
      options: {
        data: {
          username: cleanUsername,
        },
      },
    });

    if (error) {
      console.error('Signup error:', error.message);
      throw new Error(error.message);
    }

    const newUser = data.user;

    if (newUser) {
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', newUser.id)
        .maybeSingle();

      if (checkError) {
        console.error('Profile check error:', checkError.message);
        throw new Error(
          'Account create hua ho sakta hai, lekin profile verify nahi hui. Dobara signup na karein.'
        );
      }

      if (!existingProfile) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: newUser.id,
            username: cleanUsername,
            email: syntheticEmail,
            balance: 0,
            total_profits: 0,
            completed_tasks: 0,
            vip_level: 'VIP 0 - Regular',
          });

        if (insertError) {
          console.error('Profile insert error:', insertError.message);
          throw new Error(
            'Account create hua ho sakta hai, lekin profile save nahi hui. Dobara signup se pehle issue check karein.'
          );
        }
      }
    }

    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }

    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
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
