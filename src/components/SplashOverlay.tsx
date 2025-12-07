import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { PastelBackdrop } from './PastelBackdrop';
import { theme } from '@/theme';

type Props = {
  onFinish: () => void;
};

export function SplashOverlay({ onFinish }: Props) {
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        delay: 1200,
        duration: 500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  }, [onFinish, opacity, scale]);

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity, transform: [{ scale }] }]}>
      <PastelBackdrop />
      <View style={styles.center}>
        <LinearGradient colors={['#c0e1ff', '#f6d9ff']} style={styles.logo}>
          <Text style={styles.logoText}>XS</Text>
        </LinearGradient>
        <Text style={styles.tagline}>FitnessXS</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7b8dbd',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    borderWidth: 1,
    borderColor: '#e0e6f4',
  },
  logoText: {
    color: '#1a2a52',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  tagline: {
    marginTop: 16,
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
});
