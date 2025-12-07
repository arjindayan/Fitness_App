import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { LoadingScreen } from '@/components/LoadingScreen';
import { useSessionContext } from '@/state/SessionProvider';

export default function Index() {
  const { session, profile, isLoading } = useSessionContext();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!session) {
      router.replace('/(auth)');
      return;
    }

    if (!profile?.onboarding_complete) {
      router.replace('/(onboarding)');
      return;
    }

    router.replace('/(tabs)/today');
  }, [session, profile, isLoading, router]);

  return <LoadingScreen message="FitnessXS hazırlanıyor..." />;
}
