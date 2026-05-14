import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOW, RADIUS, SPACING } from '../../config/theme';

interface KPICardProps {
  title: string;
  value: string;
  icon: string; // MaterialCommunityIcons name
  color?: string;
  trend?: string;
  trendUp?: boolean;
}

export default function KPICard({
  title,
  value,
  icon,
  color = COLORS.primary,
  trend,
  trendUp,
}: KPICardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={[styles.iconWrap, { backgroundColor: color + '15' }]}>
          <MaterialCommunityIcons name={icon as any} size={22} color={color} />
        </View>
        {trend && (
          <View
            style={[
              styles.trendBadge,
              { backgroundColor: trendUp !== false ? COLORS.successLight : COLORS.errorLight },
            ]}
          >
            <Text style={[styles.trendText, { color: trendUp !== false ? COLORS.success : COLORS.error }]}>
              {trendUp !== false ? '↑' : '↓'} {trend}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.value} numberOfLines={1}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: SPACING.xs,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOW.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendBadge: { borderRadius: RADIUS.full, paddingHorizontal: 7, paddingVertical: 3 },
  trendText: { fontSize: 10, fontWeight: '700' },
  value: { fontSize: 22, fontWeight: '800', color: COLORS.text1, letterSpacing: -0.8, marginBottom: 2 },
  title: { fontSize: 12, color: COLORS.text3, fontWeight: '500' },
});
