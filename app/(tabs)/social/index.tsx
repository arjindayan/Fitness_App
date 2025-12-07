import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';

export default function SocialScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Sosyal</Text>
        <Text style={styles.copy}>
          Arkadaş ekleme, beraber idman istekleri ve bildirimler Social-1 sprintinde gelecek.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#030303',
  },
  container: {
    flex: 1,
    backgroundColor: '#030303',
    padding: 24,
    gap: 12,
  },
  title: {
    color: '#f8f8f8',
    fontSize: 24,
    fontWeight: '700',
  },
  copy: {
    color: '#9da1b5',
  },
});
