import { LoadingScreen } from '@/components/LoadingScreen';

// Bu sayfa sadece geçiş sayfası - routing app/_layout.tsx'te yönetiliyor
export default function Index() {
  return <LoadingScreen message="FitnessXS hazırlanıyor..." />;
}
