import { Session } from '@supabase/supabase-js';
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { supabase } from '../lib/supabase';
import { Profile } from '../types/profile';

type SessionContextValue = {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isProfileLoading: boolean;
  refreshProfile: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

type Props = {
  children: ReactNode;
};

export function SessionProvider({ children }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    supabase.auth
  .getSession()
  .then(({ data, error }) => {
    console.log('session?', data.session); // << burada

    if (!isMounted) {
      return;
    }

    if (error) {
      console.error('Failed to fetch session', error);
    } else {
      setSession(data.session ?? null);
    }
  })
  .finally(() => {
    if (isMounted) {
      setIsSessionLoading(false);
    }
  });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);

      if (!nextSession) {
        setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loadProfile = useCallback(async () => {
    if (!session?.user) {
      setProfile(null);
      return;
    }

    setIsProfileLoading(true);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('Failed to load profile', error);
      }
      setProfile(null);
      setIsProfileLoading(false);
      return;
    }

    // Eğer profil yoksa otomatik oluştur
    if (!data) {
      const insertPayload = {
        id: session.user.id,
        display_name: session.user.email?.split('@')[0] ?? 'Kullanıcı',
        mail: session.user.email ?? null,
        onboarding_complete: false,
        training_days: [],
        timezone: 'UTC',
      };
      const { data: created, error: insertError } = await supabase
        .from('profiles')
        .upsert(insertPayload, { onConflict: 'id' })
        .select('*')
        .single();

      if (insertError) {
        console.error('Failed to create profile', insertError);
        setProfile(null);
        setIsProfileLoading(false);
        return;
      }

      setProfile({
        ...created,
        training_days: (created.training_days ?? []) as Profile['training_days'],
        onboarding_complete: Boolean(created.onboarding_complete),
      });
      setIsProfileLoading(false);
      return;
    }

    setProfile({
      ...data,
      training_days: (data.training_days ?? []) as Profile['training_days'],
      onboarding_complete: Boolean(data.onboarding_complete),
    });

    setIsProfileLoading(false);
  }, [session?.user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const value = useMemo(
    () => ({
      session,
      profile,
      isLoading: isSessionLoading || isProfileLoading,
      isProfileLoading,
      refreshProfile: loadProfile,
    }),
    [session, profile, isSessionLoading, isProfileLoading, loadProfile]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSessionContext() {
  const ctx = useContext(SessionContext);

  if (!ctx) {
    throw new Error('useSessionContext must be used within SessionProvider');
  }

  return ctx;
}
