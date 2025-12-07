import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PastelBackdrop } from '@/components/PastelBackdrop';
import { theme } from '@/theme';

export default function NotFound() {
  return (
    <View style={styles.container}>
      <PastelBackdrop />
      <Text style={styles.title}>Ekran bulunamadı</Text>
      <Link href="/" style={styles.link}>
        Ana sayfaya dön
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    gap: 12,
  },
  title: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  link: {
    color: '#1a2a52',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    fontWeight: '700',
  },
});
