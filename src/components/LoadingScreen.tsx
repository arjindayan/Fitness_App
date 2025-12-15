import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useMemo } from 'react';

import { PastelBackdrop } from './PastelBackdrop';
import { Theme, useTheme } from '@/theme';

type Props = {
  message?: string;
};

export function LoadingScreen({ message = 'Yukleniyor...' }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <PastelBackdrop />
      <ActivityIndicator size="large" color={theme.colors.text} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      backgroundColor: theme.colors.background,
    },
    text: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
  });
