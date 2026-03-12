import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

export function PastelBackdrop() {
  const { isDark } = useTheme();

  const gradientColors = isDark ? ['#0f1627', '#0c1323', '#0f1b32'] : ['#fdf7ff', '#eef4ff', '#f6fdff'];
  const pinkGlow = isDark ? ['rgba(255, 147, 197, 0.14)', 'transparent'] : ['rgba(255, 194, 222, 0.4)', 'transparent'];
  const blueGlow = isDark ? ['rgba(123, 173, 255, 0.18)', 'transparent'] : ['rgba(183, 214, 255, 0.45)', 'transparent'];

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={pinkGlow}
        start={{ x: 0.2, y: 0.2 }}
        end={{ x: 1, y: 1 }}
        style={styles.pinkGlow}
      />
      <LinearGradient
        colors={blueGlow}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.2, y: 1 }}
        style={styles.blueGlow}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pinkGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    top: -80,
    left: -40,
  },
  blueGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    bottom: -60,
    right: -40,
  },
});
