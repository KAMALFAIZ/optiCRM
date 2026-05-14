import React from 'react';
import { Text, TextStyle } from 'react-native';
import { formatCurrency } from '../../utils/formatting';

interface CurrencyDisplayProps {
  amount: number | null | undefined;
  style?: TextStyle;
}

export default function CurrencyDisplay({ amount, style }: CurrencyDisplayProps) {
  return <Text style={style}>{formatCurrency(amount)}</Text>;
}
