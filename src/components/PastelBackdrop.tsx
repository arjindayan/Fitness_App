import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

export function PastelBackdrop() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={['#fdf7ff', '#eef4ff', '#f6fdff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={['rgba(255, 194, 222, 0.4)', 'transparent']}
        start={{ x: 0.2, y: 0.2 }}
        end={{ x: 1, y: 1 }}
        style={styles.pinkGlow}
      />
      <LinearGradient
        colors={['rgba(183, 214, 255, 0.45)', 'transparent']}
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
