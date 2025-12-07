import { MovementCategory, MovementDifficulty, MovementEquipment } from '@/types/movement';

export const MOVEMENT_DIFFICULTIES: { label: string; value: MovementDifficulty }[] = [
  { label: 'Başlangıç', value: 'beginner' },
  { label: 'Orta', value: 'intermediate' },
  { label: 'İleri', value: 'advanced' },
];

export const MOVEMENT_EQUIPMENTS: { label: string; value: MovementEquipment }[] = [
  { label: 'Barbell', value: 'barbell' },
  { label: 'Dumbbell', value: 'dumbbell' },
  { label: 'Vücut ağırlığı', value: 'bodyweight' },
  { label: 'Makine', value: 'machine' },
  { label: 'Kablo', value: 'cable' },
  { label: 'Kettlebell', value: 'kettlebell' },
  { label: 'Band', value: 'band' },
  { label: 'Diğer', value: 'other' },
];

export const MOVEMENT_CATEGORIES: MovementCategory[] = [
  { id: 'push', name: 'Push', icon: '💪' },
  { id: 'pull', name: 'Pull', icon: '🏋️' },
  { id: 'legs', name: 'Bacak', icon: '🦵' },
  { id: 'core', name: 'Core', icon: '🧘' },
  { id: 'cardio', name: 'Cardio', icon: '❤️' },
];
