// Hareket isimlerini PNG dosya isimleriyle eşleştirme
// PNG dosyaları assets/movements/ klasöründe olmalı

type MovementImageMap = {
  [key: string]: any; // require() için
};

// PNG dosya isimlerini hareket isimleriyle eşleştir
export const movementImageMap: MovementImageMap = {
  'Incline Dumbbell Curl': require('../../assets/movements/001_incline_dumbbell_curl.png'),
  'Machine Row': require('../../assets/movements/002_machine_row.png'),
  'Shrug (Barbell)': require('../../assets/movements/003_shrug_barbell (2).png'),
  'Romanian Deadlift (RDL)': require('../../assets/movements/004_romanian_deadlift_rdl.png'),
  'Concentration Curl': require('../../assets/movements/005_concentration_curl.png'),
  'Rear Delt Fly (dumbbell)': require('../../assets/movements/006_rear_delt_fly_dumbell.png'),
  'Neutral-Grip Pull-up': require('../../assets/movements/007_neutral_grip_pull_up.png'),
  'Triceps Pushdown (rope)': require('../../assets/movements/008_triceps_pushdown.png'),
  'Back Squat': require('../../assets/movements/009_squat.png'),
  'Bench Press (Barbell)': require('../../assets/movements/010_bench_press_barbell.png'),
  'Diamond Push-up': require('../../assets/movements/011_diamond_push_up.jpg'),
  'Back Extension (hyperextension)': require('../../assets/movements/012_back_extension_hyperextension.png'),
  'Seated Cable Row': require('../../assets/movements/013_seated_cable_row.png'),
  'Triceps Pushdown (bar)': require('../../assets/movements/014_triceps_pushdown_bar.png'),
  'Alternating Curl': require('../../assets/movements/015_alternating_curl.png'),
  'Pec Deck (Machine Fly)': require('../../assets/movements/016_pec_deck_machine_fly.png'),
  'Step-up': require('../../assets/movements/017_step_up.png'),
  'Incline Dumbbell Press': require('../../assets/movements/018_incline_dumbbell_press.png'),
  'Trap Bar Deadlift': require('../../assets/movements/019_trap_bar_deadlift.png'),
  'Rear Delt Fly (reverse pec deck)': require('../../assets/movements/021_rear_delt_fly_reverse_pec_deck.png'),
  'Dumbbell Shrug': require('../../assets/movements/022_dumbbell_shrug.png'),
  'Dumbbell Bench Press': require('../../assets/movements/023_dumbbell_press.png'),
  'Upright Row': require('../../assets/movements/024_upright_row.png'),
  'Chin-up': require('../../assets/movements/025_chin_up.png'),
  'Dumbbell Fly': require('../../assets/movements/026_dumbbell_fly.png'),
  'Rope Hammer Curl': require('../../assets/movements/027_rope_hammer_curl.png'),
  'Cable Curl': require('../../assets/movements/028_cable_curl.png'),
  'Archer Push-up': require('../../assets/movements/029_archer_push_up.png'),
  'Close-Grip Lat Pulldown': require('../../assets/movements/030_close_grip_lat_pulldown.png'),
  'Leg Curl (lying)': require('../../assets/movements/031_leg_curl_lying.png'),
  'Dumbbell Shoulder Press': require('../../assets/movements/032_dumbbell_shoulder_press.png'),
  'Overhead Press (Barbell)': require('../../assets/movements/033_overhead_press.png'),
};

// Hareket ismine göre local image asset'ini döndür
export function getMovementImage(movementName: string | null | undefined): any {
  if (!movementName) return null;
  
  // Tam eşleşme
  if (movementImageMap[movementName]) {
    return movementImageMap[movementName];
  }
  
  // Kısmi eşleşme (büyük/küçük harf duyarsız)
  const normalizedName = movementName.toLowerCase().trim();
  for (const [key, value] of Object.entries(movementImageMap)) {
    if (key.toLowerCase().trim() === normalizedName) {
      return value;
    }
  }
  
  return null;
}
