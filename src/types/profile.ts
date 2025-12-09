export type TrainingDay =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  mail: string | null;
  goal: string | null;
  goal_description: string | null;
  timezone: string | null;
  training_days: TrainingDay[];
  onboarding_complete: boolean;
  user_code: string | null; // Arkadaş ekleme için unique kod (örn: FIT-ABC123)
  created_at?: string | null;
  updated_at?: string | null;
};

// Arkadaşlık İsteği
export type FriendRequest = {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  // Join edilen veriler
  sender?: {
    id: string;
    display_name: string | null;
    user_code: string | null;
    avatar_url: string | null;
  };
  receiver?: {
    id: string;
    display_name: string | null;
    user_code: string | null;
    avatar_url: string | null;
  };
};

// Arkadaşlık
export type Friendship = {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
  // Join edilen veriler
  friend?: {
    id: string;
    display_name: string | null;
    user_code: string | null;
    avatar_url: string | null;
    goal: string | null;
  };
};
