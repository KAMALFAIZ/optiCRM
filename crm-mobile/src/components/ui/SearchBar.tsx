import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { Searchbar } from 'react-native-paper';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChangeText, placeholder = 'Rechercher...' }: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChangeText = (text: string) => {
    setLocalValue(text);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      onChangeText(text);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <Searchbar
      placeholder={placeholder}
      onChangeText={handleChangeText}
      value={localValue}
      style={styles.searchbar}
      inputStyle={styles.input}
    />
  );
}

const styles = StyleSheet.create({
  searchbar: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
    borderRadius: 8,
  },
  input: {
    fontSize: 14,
  },
});
