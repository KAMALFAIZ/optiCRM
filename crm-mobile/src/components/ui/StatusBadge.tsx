import React from 'react';
import { Chip } from 'react-native-paper';
import { StyleSheet } from 'react-native';
import { getStatusColor } from '../../utils/constants';

interface StatusBadgeProps {
  status: string;
  statusList?: Array<{ value: string; label: string; color: string }>;
}

export default function StatusBadge({ status, statusList }: StatusBadgeProps) {
  const item = statusList?.find((s) => s.value === status);
  const label = item?.label || status;
  const color = item?.color || getStatusColor(status);

  return (
    <Chip
      style={[styles.chip, { backgroundColor: color + '20' }]}
      textStyle={[styles.text, { color }]}
      compact
    >
      {label}
    </Chip>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    height: 28,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
