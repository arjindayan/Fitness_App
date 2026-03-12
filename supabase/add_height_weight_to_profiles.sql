-- Add height and weight columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS height_cm INTEGER,
ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(5, 2);

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.height_cm IS 'Kullanıcının boyu (santimetre)';
COMMENT ON COLUMN public.profiles.weight_kg IS 'Kullanıcının kilosu (kilogram)';
