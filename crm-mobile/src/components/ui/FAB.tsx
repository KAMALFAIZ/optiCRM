import React from 'react';
import { StyleSheet } from 'react-native';
import { FAB as PaperFAB } from 'react-native-paper';
import { COLORS } from '../../utils/constants';

interface FABProps {
  icon: string;
  onPress: () => void;
  label?: string;
}

export default function FAB({ icon, onPress, label }: FABProps) {
  return (
    <PaperFAB
      icon={icon}
      onPress={onPress}
      label={label}
      style={styles.fab}
      color="#fff"
    />
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: COLORS.primary,
  },
});
