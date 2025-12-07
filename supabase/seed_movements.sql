-- Movement categories (adjust IDs as needed or rely on text)
insert into public.movement_categories (id, name, icon)
values
  ('chest', 'Chest', '💪'),
  ('back', 'Back', '🏋'),
  ('shoulders', 'Shoulders', '🏋'),
  ('biceps', 'Biceps', '💪'),
  ('triceps', 'Triceps', '💪'),
  ('forearm', 'Forearm / Grip', '✊'),
  ('quads', 'Quads', '🦵'),
  ('hamstrings', 'Hamstrings', '🦵'),
  ('glutes', 'Glutes', '🍑'),
  ('calves', 'Calves', '🦶'),
  ('core', 'Core', '🧘'),
  ('erector', 'Erector', '🧘')
on conflict (id) do nothing;

-- Chest
insert into public.movements (name, category_id, equipment, difficulty, instructions, is_custom)
values
  ('Bench Press (Barbell)', 'chest', 'barbell', 'intermediate', '3x8 kontrol', false),
  ('Dumbbell Bench Press', 'chest', 'dumbbell', 'beginner', '3x10', false),
  ('Incline Bench Press', 'chest', 'barbell', 'intermediate', 'Eğimli 30-45°', false),
  ('Incline Dumbbell Press', 'chest', 'dumbbell', 'beginner', 'Eğimli 30-45°', false),
  ('Decline Bench Press', 'chest', 'barbell', 'intermediate', 'Alçak bench', false),
  ('Close-Grip Bench Press', 'chest', 'barbell', 'intermediate', 'Triceps vurgu', false),
  ('Dumbbell Fly', 'chest', 'dumbbell', 'beginner', 'Hafif kilo, geniş açılım', false),
  ('Incline Dumbbell Fly', 'chest', 'dumbbell', 'intermediate', 'Eğimli bench', false),
  ('Cable Fly (Mid)', 'chest', 'cable', 'beginner', 'Orta yükseklik', false),
  ('Cable Fly (High to Low)', 'chest', 'cable', 'intermediate', 'Üstten aşağı', false),
  ('Cable Fly (Low to High)', 'chest', 'cable', 'intermediate', 'Alttan yukarı', false),
  ('Pec Deck (Machine Fly)', 'chest', 'machine', 'beginner', 'Kontrollü kapanış', false),
  ('Push-up', 'chest', 'bodyweight', 'beginner', 'Tam kilitlenme', false),
  ('Incline Push-up', 'chest', 'bodyweight', 'beginner', 'Eğimli destek', false),
  ('Decline Push-up', 'chest', 'bodyweight', 'intermediate', 'Ayak yükseltilmiş', false),
  ('Diamond Push-up', 'chest', 'bodyweight', 'intermediate', 'Triceps vurgu', false),
  ('Archer Push-up', 'chest', 'bodyweight', 'advanced', 'Yan yükleme', false),
  ('Ring Push-up', 'chest', 'bodyweight', 'advanced', 'Ring stabilite', false),
  ('Dips (Chest focus)', 'chest', 'bodyweight', 'intermediate', 'Öne eğilerek', false),
  ('Chest Press Machine', 'chest', 'machine', 'beginner', 'Nötr tutuş', false),
  ('Landmine Press (chest/shoulder)', 'chest', 'barbell', 'intermediate', '45° landmine', false);

-- Back - lats/mid back
insert into public.movements (name, category_id, equipment, difficulty, instructions, is_custom)
values
  ('Pull-up', 'back', 'bodyweight', 'intermediate', 'Tam kilitlenme, göğüs bara', false),
  ('Chin-up', 'back', 'bodyweight', 'intermediate', 'Supine tutuş', false),
  ('Neutral-Grip Pull-up', 'back', 'bodyweight', 'intermediate', 'Nötr tutuş', false),
  ('Lat Pulldown', 'back', 'machine', 'beginner', 'Omuz genişliği tutuş', false),
  ('Close-Grip Lat Pulldown', 'back', 'machine', 'beginner', 'Dar tutuş', false),
  ('Straight-Arm Pulldown', 'back', 'cable', 'beginner', 'Dirsek sabit', false),
  ('Barbell Row', 'back', 'barbell', 'intermediate', 'Hafif öne eğil', false),
  ('Pendlay Row', 'back', 'barbell', 'advanced', 'Yer başlangıçlı', false),
  ('Dumbbell Row (tek kol)', 'back', 'dumbbell', 'beginner', 'Bench destek', false),
  ('Chest-Supported Row', 'back', 'dumbbell', 'beginner', 'Eğimli bench destekli', false),
  ('Seated Cable Row', 'back', 'cable', 'beginner', 'Dik oturuş', false),
  ('T-Bar Row', 'back', 'barbell', 'intermediate', 'Landmine ataşman', false),
  ('Machine Row', 'back', 'machine', 'beginner', 'Hammer Strength vb.', false),
  ('Inverted Row (TRX/bar)', 'back', 'bodyweight', 'beginner', 'Vücut paralel', false),
  ('Meadows Row', 'back', 'barbell', 'advanced', 'Tek kol landmine', false),
  ('Landmine Row', 'back', 'barbell', 'intermediate', 'Omuz genişliği', false),
  ('Kroc Row', 'back', 'dumbbell', 'advanced', 'Ağır tek kol', false),
  ('Renegade Row', 'back', 'dumbbell', 'advanced', 'Plank pozisyonu', false);

-- Back - traps / upper back
insert into public.movements (name, category_id, equipment, difficulty, instructions, is_custom)
values
  ('Face Pull', 'back', 'cable', 'beginner', 'Rope göz hizası', false),
  ('Rear Delt Fly (dumbbell)', 'back', 'dumbbell', 'beginner', 'Yanal menteşe', false),
  ('Rear Delt Fly (cable)', 'back', 'cable', 'beginner', 'Cross-over', false),
  ('Shrug (Barbell)', 'back', 'barbell', 'beginner', 'Yukarı çek, tut', false),
  ('Dumbbell Shrug', 'back', 'dumbbell', 'beginner', 'Kulaklara doğru', false),
  ('Trap Bar Shrug', 'back', 'other', 'beginner', 'Nötr tutuş', false),
  ('Upright Row', 'back', 'barbell', 'intermediate', 'Omuz sağlığına dikkat', false),
  ('Scapular Pull-up', 'back', 'bodyweight', 'beginner', 'Depresyon/protraksiyon', false);

-- Shoulders
insert into public.movements (name, category_id, equipment, difficulty, instructions, is_custom)
values
  ('Overhead Press (Barbell)', 'shoulders', 'barbell', 'intermediate', 'Dik pozisyon', false),
  ('Dumbbell Shoulder Press', 'shoulders', 'dumbbell', 'beginner', 'Oturur veya ayakta', false),
  ('Arnold Press', 'shoulders', 'dumbbell', 'intermediate', 'Pronasyon dönüş', false),
  ('Push Press', 'shoulders', 'barbell', 'advanced', 'Hafif dip-drive', false),
  ('Landmine Press', 'shoulders', 'barbell', 'intermediate', '45° itiş', false),
  ('Lateral Raise (Dumbbell)', 'shoulders', 'dumbbell', 'beginner', 'Dirsek hafif kırık', false),
  ('Cable Lateral Raise', 'shoulders', 'cable', 'beginner', 'Tek kol', false),
  ('Machine Lateral Raise', 'shoulders', 'machine', 'beginner', 'Kontrollü', false),
  ('Front Raise (Plate/Dumbbell)', 'shoulders', 'dumbbell', 'beginner', 'Omuz hizası', false),
  ('Rear Delt Fly (reverse pec deck)', 'shoulders', 'machine', 'beginner', 'Arka omuz', false),
  ('Cuban Press', 'shoulders', 'dumbbell', 'intermediate', 'Hafif kilo', false),
  ('Y-Raise (incline)', 'shoulders', 'dumbbell', 'beginner', 'Scapula kontrol', false),
  ('T-Raise (incline)', 'shoulders', 'dumbbell', 'beginner', 'Arka omuz', false);

-- Biceps
insert into public.movements (name, category_id, equipment, difficulty, instructions, is_custom)
values
  ('Barbell Curl', 'biceps', 'barbell', 'beginner', 'Dirsek sabit', false),
  ('EZ-Bar Curl', 'biceps', 'barbell', 'beginner', 'Nötr bilek', false),
  ('Dumbbell Curl', 'biceps', 'dumbbell', 'beginner', 'Nötr duruş', false),
  ('Alternating Curl', 'biceps', 'dumbbell', 'beginner', 'Tek tek', false),
  ('Hammer Curl', 'biceps', 'dumbbell', 'beginner', 'Nötr tutuş', false),
  ('Cross-body Hammer Curl', 'biceps', 'dumbbell', 'beginner', '45° öne', false),
  ('Incline Dumbbell Curl', 'biceps', 'dumbbell', 'intermediate', 'Bench 45-60°', false),
  ('Concentration Curl', 'biceps', 'dumbbell', 'beginner', 'Dirsek uylukta', false),
  ('Preacher Curl (EZ/Machine)', 'biceps', 'machine', 'beginner', 'Negatif kontrol', false),
  ('Cable Curl', 'biceps', 'cable', 'beginner', 'Sürekli gerilim', false),
  ('Rope Hammer Curl', 'biceps', 'cable', 'beginner', 'Bilek nötr', false),
  ('Spider Curl', 'biceps', 'dumbbell', 'intermediate', 'Göğüs bench üstünde', false),
  ('Zottman Curl', 'biceps', 'dumbbell', 'intermediate', 'Supine to prone dönüş', false);

-- Triceps
insert into public.movements (name, category_id, equipment, difficulty, instructions, is_custom)
values
  ('Triceps Pushdown (rope)', 'triceps', 'cable', 'beginner', 'Dirsek sabit', false),
  ('Triceps Pushdown (bar)', 'triceps', 'cable', 'beginner', 'Geniş/dar tutuş', false),
  ('Overhead Triceps Extension (DB)', 'triceps', 'dumbbell', 'beginner', 'Tek/çift kol', false),
  ('Overhead Triceps Extension (Cable)', 'triceps', 'cable', 'intermediate', 'Rope ile', false),
  ('Skull Crushers', 'triceps', 'barbell', 'intermediate', 'Dirsek sabit', false),
  ('EZ-Bar Skull Crusher', 'triceps', 'barbell', 'intermediate', 'Daha az bilek stresi', false),
  ('Close-Grip Bench Press', 'triceps', 'barbell', 'intermediate', 'Dirsek gövdeye yakın', false),
  ('Dips (triceps focus)', 'triceps', 'bodyweight', 'intermediate', 'Dik duruş', false),
  ('Diamond Push-up', 'triceps', 'bodyweight', 'intermediate', 'Triceps vurgu', false),
  ('Kickback (DB/Cable)', 'triceps', 'dumbbell', 'beginner', 'Dirsek sabit', false),
  ('JM Press', 'triceps', 'barbell', 'advanced', 'Kısa ROM', false),
  ('Machine Triceps Extension', 'triceps', 'machine', 'beginner', 'Destekli', false);

-- Forearm / Grip
insert into public.movements (name, category_id, equipment, difficulty, instructions, is_custom)
values
  ('Wrist Curl', 'forearm', 'barbell', 'beginner', 'Avuç yukarı', false),
  ('Reverse Wrist Curl', 'forearm', 'barbell', 'beginner', 'Avuç aşağı', false),
  ('Farmer’s Walk', 'forearm', 'dumbbell', 'beginner', 'Ağır yükle yürü', false),
  ('Suitcase Carry', 'forearm', 'dumbbell', 'beginner', 'Tek taraflı', false),
  ('Dead Hang', 'forearm', 'bodyweight', 'beginner', 'Barasılı bekleme', false),
  ('Plate Pinch Hold', 'forearm', 'other', 'beginner', 'Plaka sıkıştır', false),
  ('Towel Pull-up', 'forearm', 'bodyweight', 'advanced', 'Havlu tutuş', false),
  ('Reverse Curl (EZ/Barbell)', 'forearm', 'barbell', 'beginner', 'Pronasyon', false),
  ('Wrist Roller', 'forearm', 'other', 'intermediate', 'Kordon sarma', false);

-- Quads
insert into public.movements (name, category_id, equipment, difficulty, instructions, is_custom)
values
  ('Back Squat', 'quads', 'barbell', 'intermediate', 'Paralel altı', false),
  ('Front Squat', 'quads', 'barbell', 'intermediate', 'Dik gövde', false),
  ('Goblet Squat', 'quads', 'dumbbell', 'beginner', 'Dumbbell göğüste', false),
  ('Hack Squat (machine)', 'quads', 'machine', 'beginner', 'Ayak omuz genişliğinde', false),
  ('Leg Press', 'quads', 'machine', 'beginner', 'Tam kontrollü', false),
  ('Leg Extension', 'quads', 'machine', 'beginner', 'Tam kilitleme yok', false),
  ('Bulgarian Split Squat', 'quads', 'dumbbell', 'intermediate', 'Arka ayak yükseltili', false),
  ('Split Squat', 'quads', 'dumbbell', 'beginner', 'Dik gövde', false),
  ('Step-up', 'quads', 'dumbbell', 'beginner', 'Diz 90° üstü', false),
  ('Walking Lunge', 'quads', 'dumbbell', 'intermediate', 'Adım kontrollü', false),
  ('Reverse Lunge', 'quads', 'dumbbell', 'beginner', 'Geri adım', false),
  ('Sissy Squat', 'quads', 'other', 'advanced', 'Diz öne iter', false),
  ('Wall Sit', 'quads', 'bodyweight', 'beginner', 'Diz 90°', false),
  ('Cyclist Squat', 'quads', 'barbell', 'intermediate', 'Topuk yükseltili', false);

-- Hamstrings / posterior chain
insert into public.movements (name, category_id, equipment, difficulty, instructions, is_custom)
values
  ('Romanian Deadlift (RDL)', 'hamstrings', 'barbell', 'intermediate', 'Kalça menteşesi', false),
  ('Stiff-Leg Deadlift', 'hamstrings', 'barbell', 'advanced', 'Dizler hafif bükük', false),
  ('Deadlift (Conventional)', 'hamstrings', 'barbell', 'intermediate', 'Nötr sırt', false),
  ('Sumo Deadlift', 'hamstrings', 'barbell', 'intermediate', 'Geniş stance', false),
  ('Trap Bar Deadlift', 'hamstrings', 'other', 'beginner', 'Nötr tutuş', false),
  ('Good Morning', 'hamstrings', 'barbell', 'intermediate', 'Hafif ağırlık', false),
  ('Hip Hinge Drill', 'hamstrings', 'other', 'beginner', 'Dowel ile', false),
  ('Leg Curl (lying)', 'hamstrings', 'machine', 'beginner', 'Kontrollü', false),
  ('Leg Curl (seated)', 'hamstrings', 'machine', 'beginner', 'Tam ROM', false),
  ('Nordic Ham Curl', 'hamstrings', 'bodyweight', 'advanced', 'Partner/ankle fix', false),
  ('Glute-Ham Raise', 'hamstrings', 'machine', 'advanced', 'Slow eccentrics', false),
  ('Kettlebell Swing', 'hamstrings', 'kettlebell', 'intermediate', 'Hip snap', false),
  ('Cable Pull-through', 'hamstrings', 'cable', 'beginner', 'Kalça menteşesi', false);

-- Glutes
insert into public.movements (name, category_id, equipment, difficulty, instructions, is_custom)
values
  ('Hip Thrust (barbell)', 'glutes', 'barbell', 'beginner', 'Üstte 1 sn tut', false),
  ('Glute Bridge', 'glutes', 'bodyweight', 'beginner', 'Top squeeze', false),
  ('Single-Leg Glute Bridge', 'glutes', 'bodyweight', 'intermediate', 'Bir bacak', false),
  ('Cable Kickback', 'glutes', 'cable', 'beginner', 'Kontrollü', false),
  ('Machine Glute Kickback', 'glutes', 'machine', 'beginner', 'Glute fokus', false),
  ('Frog Pump', 'glutes', 'bodyweight', 'beginner', 'Yüksek tekrar', false),
  ('Step-up (glute focus)', 'glutes', 'dumbbell', 'intermediate', 'Kalça geri', false),
  ('Curtsy Lunge', 'glutes', 'dumbbell', 'intermediate', 'Çapraz adım', false),
  ('Bulgarian Split Squat (glute bias)', 'glutes', 'dumbbell', 'intermediate', 'Öne eğil', false),
  ('Reverse Hyper', 'glutes', 'machine', 'advanced', 'Kontrollü', false),
  ('Banded Lateral Walk', 'glutes', 'band', 'beginner', 'Yan adım', false),
  ('Clamshell', 'glutes', 'band', 'beginner', 'Diz açılım', false),
  ('Hip Abduction Machine', 'glutes', 'machine', 'beginner', 'Dışa açılım', false);

-- Calves
insert into public.movements (name, category_id, equipment, difficulty, instructions, is_custom)
values
  ('Standing Calf Raise', 'calves', 'machine', 'beginner', 'Tam esneme', false),
  ('Seated Calf Raise', 'calves', 'machine', 'beginner', 'Diz 90°', false),
  ('Donkey Calf Raise', 'calves', 'other', 'intermediate', 'Kalça menteşeli', false),
  ('Single-Leg Calf Raise', 'calves', 'bodyweight', 'beginner', 'Denge', false),
  ('Calf Press (leg press)', 'calves', 'machine', 'beginner', 'Plaka ile', false),
  ('Tibialis Raise', 'calves', 'other', 'beginner', 'Ayak flexion', false);

-- Core
insert into public.movements (name, category_id, equipment, difficulty, instructions, is_custom)
values
  ('Plank', 'core', 'bodyweight', 'beginner', 'Nötr omurga', false),
  ('Side Plank', 'core', 'bodyweight', 'beginner', 'Kalça yüksek', false),
  ('Dead Bug', 'core', 'bodyweight', 'beginner', 'Bel boşluğu kapalı', false),
  ('Bird Dog', 'core', 'bodyweight', 'beginner', 'Zıt kol/bacak', false),
  ('Hollow Hold', 'core', 'bodyweight', 'intermediate', 'Bel yere temas', false),
  ('Crunch', 'core', 'bodyweight', 'beginner', 'Kısa ROM', false),
  ('Cable Crunch', 'core', 'cable', 'intermediate', 'Kablo üstten', false),
  ('Hanging Leg Raise', 'core', 'bodyweight', 'advanced', 'Düz bacak', false),
  ('Knee Raise (captain’s chair)', 'core', 'machine', 'intermediate', 'Diz çekiş', false),
  ('Reverse Crunch', 'core', 'bodyweight', 'beginner', 'Kalça yukarı', false),
  ('Bicycle Crunch', 'core', 'bodyweight', 'beginner', 'Dirsek-diz çapraz', false),
  ('Ab Wheel Rollout', 'core', 'other', 'advanced', 'Bel nötr tut', false),
  ('Russian Twist', 'core', 'other', 'beginner', 'Hafif yük', false),
  ('Pallof Press', 'core', 'cable', 'beginner', 'Anti-rotation', false),
  ('Cable Woodchop (high to low)', 'core', 'cable', 'intermediate', 'Diyagonal çekiş', false),
  ('Cable Woodchop (low to high)', 'core', 'cable', 'intermediate', 'Diyagonal itiş', false),
  ('Mountain Climber', 'core', 'bodyweight', 'beginner', 'Plank formu', false),
  ('V-up', 'core', 'bodyweight', 'advanced', 'Çift bacak-kol', false),
  ('Toe Touches', 'core', 'bodyweight', 'beginner', 'Kısa hareket', false),
  ('L-sit', 'core', 'bodyweight', 'advanced', 'Paralel bar', false);

-- Erector / lower back
insert into public.movements (name, category_id, equipment, difficulty, instructions, is_custom)
values
  ('Back Extension (hyperextension)', 'erector', 'machine', 'beginner', 'Nötr omurga', false);

-- Ensure no duplicates on repeated runs
-- Optionally add: on conflict do nothing per row if unique constraint exists on name.
