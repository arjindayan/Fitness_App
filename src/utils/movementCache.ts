import AsyncStorage from '@react-native-async-storage/async-storage';

import { Movement } from '@/types/movement';

const CACHE_KEY = 'fitnessxs_movement_cache_v1';

export async function saveMovementsToCache(movements: Movement[]) {
  try {
    const payload = JSON.stringify({
      data: movements,
      timestamp: Date.now(),
    });
    await AsyncStorage.setItem(CACHE_KEY, payload);
  } catch (error) {
    console.warn('Hareket cache yazılamadı', error);
  }
}

export async function getMovementsFromCache(): Promise<{ data: Movement[]; timestamp: number } | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
