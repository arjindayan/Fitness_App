import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { MOVEMENT_CATEGORIES } from '@/constants/movements';
import { supabase } from '@/lib/supabase';
import { Movement } from '@/types/movement';
import { saveMovementsToCache, getMovementsFromCache } from '@/utils/movementCache';

type MovementQueryParams = {
  search?: string;
  categoryId?: string | null;
  equipment?: string | null;
};

const MOVEMENT_QUERY_KEY = ['movements'];

export async function fetchMovements(params: MovementQueryParams = {}): Promise<Movement[]> {
  let query = supabase
    .from('movements')
    .select('*')
    .order('name', { ascending: true });

  if (params.search) {
    query = query.ilike('name', `%${params.search}%`);
  }

  if (params.categoryId) {
    query = query.eq('category_id', params.categoryId);
  }

  if (params.equipment) {
    query = query.eq('equipment', params.equipment);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  await saveMovementsToCache(data ?? []);
  return data ?? [];
}

export function useMovementList(params: MovementQueryParams) {
  return useQuery({
    queryKey: [...MOVEMENT_QUERY_KEY, params],
    queryFn: async () => {
      try {
        return await fetchMovements(params);
      } catch (error) {
        const cache = await getMovementsFromCache();
        if (cache?.data) {
          return cache.data;
        }
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5,
  });
}

type CreateMovementPayload = {
  name: string;
  categoryId?: string | null;
  equipment?: string | null;
  difficulty?: string | null;
  instructions?: string | null;
  videoUrl?: string | null;
};

export async function createCustomMovement(payload: CreateMovementPayload) {
  const { data, error } = await supabase
    .from('movements')
    .insert({
      name: payload.name,
      category_id: payload.categoryId ?? null,
      equipment: payload.equipment ?? null,
      difficulty: payload.difficulty ?? null,
      instructions: payload.instructions ?? null,
      video_url: payload.videoUrl ?? null,
      is_custom: true,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as Movement;
}

export function useCreateMovementMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCustomMovement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MOVEMENT_QUERY_KEY });
    },
  });
}

export function getMovementCategoryLabel(id?: string | null) {
  return MOVEMENT_CATEGORIES.find((c) => c.id === id)?.name ?? 'Genel';
}
