-- Add image_url column to movements table
ALTER TABLE public.movements 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Update some popular exercises with placeholder images (from Unsplash - free to use)
-- You can replace these with actual exercise images later

-- Chest exercisesr
UPDATE public.movements SET image_url = 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400' WHERE name = 'Bench Press (Barbell)';
UPDATE public.movements SET image_url = 'https://images.unsplash.com/photo-1598268030450-7a476f602b5b?w=400' WHERE name = 'Dumbbell Bench Press';
UPDATE public.movements SET image_url = 'https://images.unsplash.com/photo-1598266663439-2056e6900339?w=400' WHERE name = 'Push-up';

-- Back exercises
UPDATE public.movements SET image_url = 'https://images.unsplash.com/photo-1598971457999-ca4ef48a9a71?w=400' WHERE name = 'Pull-up';
UPDATE public.movements SET image_url = 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400' WHERE name = 'Lat Pulldown';
UPDATE public.movements SET image_url = 'https://images.unsplash.com/photo-1534368959876-26bf04f2c947?w=400' WHERE name = 'Barbell Row';

-- Leg exercises  
UPDATE public.movements SET image_url = 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400' WHERE name = 'Back Squat';
UPDATE public.movements SET image_url = 'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=400' WHERE name = 'Leg Press';
UPDATE public.movements SET image_url = 'https://images.unsplash.com/photo-1597452485669-2c7bb5fef90d?w=400' WHERE name = 'Romanian Deadlift (RDL)';

-- Shoulder exercises
UPDATE public.movements SET image_url = 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=400' WHERE name = 'Overhead Press (Barbell)';
UPDATE public.movements SET image_url = 'https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=400' WHERE name = 'Lateral Raise (Dumbbell)';

-- Arm exercises
UPDATE public.movements SET image_url = 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400' WHERE name = 'Barbell Curl';
UPDATE public.movements SET image_url = 'https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?w=400' WHERE name = 'Triceps Pushdown (rope)';

-- Core exercises
UPDATE public.movements SET image_url = 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=400' WHERE name = 'Plank';

