import { Session } from '@supabase/supabase-js';
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  const lastLoadedUserId = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    supabase.auth
  .getSession()
  .then(({ data, error }) => {
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
        lastLoadedUserId.current = null;
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loadProfile = useCallback(async (userId: string) => {
    // Aynı kullanıcı için tekrar yükleme yapma
    if (lastLoadedUserId.current === userId) {
      return;
    }

    setIsProfileLoading(true);
    lastLoadedUserId.current = userId;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
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
      const userEmail = session?.user?.email;
      const insertPayload = {
        id: userId,
        display_name: userEmail?.split('@')[0] ?? 'Kullanıcı',
        mail: userEmail ?? null,
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
  }, [session?.user?.email]);

  // Session değiştiğinde profile'ı yükle
  useEffect(() => {
    if (session?.user?.id) {
      loadProfile(session.user.id);
    } else {
      setProfile(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  // refreshProfile - mevcut kullanıcı için profile'ı yeniden yükle (force)
  const refreshProfile = useCallback(async () => {
    if (session?.user?.id) {
      lastLoadedUserId.current = null; // Force reload
      await loadProfile(session.user.id);
    }
  }, [session?.user?.id, loadProfile]);

  const value = useMemo(
    () => ({
      session,
      profile,
      isLoading: isSessionLoading || isProfileLoading,
      isProfileLoading,
      refreshProfile,
    }),
    [session, profile, isSessionLoading, isProfileLoading, refreshProfile]
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
