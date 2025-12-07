import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';

import { PastelBackdrop } from '@/components/PastelBackdrop';
import { theme } from '@/theme';

export default function SocialScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <PastelBackdrop />
      <View style={styles.container}>
        <Text style={styles.title}>Sosyal</Text>
        <View style={styles.card}>
          <Text style={styles.copy}>
            Arkadaş ekleme, beraber idman istekleri ve bildirimler Social-1 sprintinde gelecek.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    padding: 24,
    gap: 12,
  },
  title: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#a2b4d8',
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
  },
  copy: {
    color: theme.colors.muted,
    fontSize: 16,
    lineHeight: 22,
  },
});
