import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RADIUS } from '../../config/theme';

interface IconBadgeProps {
  name: string;
  size?: number;
  color?: string;
  bgColor?: string;
  badgeSize?: number;
  borderRadius?: number;
}

/**
 * Composant IconBadge — icône outline dans un conteneur coloré arrondi.
 * Design unifié utilisé dans toutes les cards, empty states et listes.
 */
export default function IconBadge({
  name,
  size = 22,
  color = '#1976D2',
  bgColor,
  badgeSize = 44,
  borderRadius,
}: IconBadgeProps) {
  const bg = bgColor ?? color + '1A'; // 10% opacity par défaut
  const radius = borderRadius ?? badgeSize / 2.5;

  return (
    <View
      style={[
        styles.badge,
        {
          width: badgeSize,
          height: badgeSize,
          borderRadius: radius,
          backgroundColor: bg,
        },
      ]}
    >
      <MaterialCommunityIcons name={name as any} size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
