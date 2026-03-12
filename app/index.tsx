import { LoadingScreen } from '@/components/common/LoadingScreen';

// Bu sayfa sadece geçiş sayfası - routing app/_layout.tsx'te yönetiliyor
export default function Index() {
  return <LoadingScreen message="FitnessXS hazırlanıyor..." />;
}
