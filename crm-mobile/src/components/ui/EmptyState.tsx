import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../../config/theme';

interface EmptyStateProps {
  /** Nom d'icône MaterialCommunityIcons (ex: 'bell-outline', 'calendar-outline') */
  icon?: string;
  title: string;
  subtitle?: string;
  iconColor?: string;
}

export default function EmptyState({
  icon = 'tray-remove',
  title,
  subtitle,
  iconColor = COLORS.text4,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <MaterialCommunityIcons
          name={icon as any}
          size={44}
          color={iconColor}
        />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 280,
  },
  iconBox: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.surface2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text2,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.text4,
    textAlign: 'center',
    lineHeight: 20,
  },
});
