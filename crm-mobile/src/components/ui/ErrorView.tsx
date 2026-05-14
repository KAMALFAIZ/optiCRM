import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { COLORS, RADIUS, SHADOW } from '../../config/theme';

export default function ErrorView({
  message = 'Une erreur est survenue',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <Text style={styles.emoji}>⚠️</Text>
      </View>
      <Text style={styles.title}>Une erreur est survenue</Text>
      <Text style={styles.msg}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.btn} onPress={onRetry}>
          <Text style={styles.btnText}>Réessayer</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: COLORS.bg },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.errorLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emoji: { fontSize: 36 },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text1, marginBottom: 8 },
  msg: { fontSize: 14, color: COLORS.text3, textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  btn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    ...SHADOW.teal,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
