import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { getProfile } from './auth';
import type { Role } from './api';

type UserProfile = {
  id: string;
  role: Role;
  full_name: string;
};

type AuthContextType = {
  user: UserProfile | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const profile = await getProfile();
      setUser(profile);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchProfile();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, refreshProfile: fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
