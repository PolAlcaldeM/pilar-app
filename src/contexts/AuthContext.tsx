import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  onboarding_completed: boolean;
}

interface Relationship {
  id: string;
  user1_id: string;
  user2_id: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  partnerProfile: Profile | null;
  relationship: Relationship | null;
  loading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<Profile | null>(null);
  const [relationship, setRelationship] = useState<Relationship | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    return data as Profile | null;
  };

  const fetchRelationship = async (userId: string) => {
    const { data } = await supabase
      .from('relationships')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .maybeSingle();
    return data as Relationship | null;
  };

  const loadUserData = async (userId: string) => {
    const [prof, rel] = await Promise.all([
      fetchProfile(userId),
      fetchRelationship(userId),
    ]);
    setProfile(prof);
    setRelationship(rel);

    if (rel) {
      const partnerId = rel.user1_id === userId ? rel.user2_id : rel.user1_id;
      const partnerProf = await fetchProfile(partnerId);
      setPartnerProfile(partnerProf);
    } else {
      setPartnerProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (session?.user?.id) {
      await loadUserData(session.user.id);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      setSession(sess);
      if (sess?.user) {
        // Use setTimeout to avoid potential deadlock with Supabase client
        setTimeout(() => loadUserData(sess.user.id), 0);
      } else {
        setProfile(null);
        setPartnerProfile(null);
        setRelationship(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      if (sess?.user) {
        loadUserData(sess.user.id).then(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message || null };
  };

  const signup = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    return { error: error?.message || null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user || null,
        profile,
        partnerProfile,
        relationship,
        loading,
        isLoggedIn: !!session?.user,
        login,
        signup,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
