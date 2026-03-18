import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as B from '../logic/board';

interface Props {
  value: B.CellValue;
  isSelected: boolean;
  isError: boolean;
  isGiven: boolean;
  onPress: () => void;
}

export function SudokuCell({ value, isSelected, isError, isGiven, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[styles.cell, isSelected && styles.selected, isError && styles.error]}
      onPress={onPress}
    >
      <Text style={[styles.value, isGiven && styles.given, isError && styles.errorText]}>
        {value === B.EMPTY ? '' : value}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cell: {
    width: 55,
    height: 55,
    borderWidth: 1,
    borderColor: '#999',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  selected: {
    backgroundColor: '#b3d4f5',
  },
  error: {
    backgroundColor: '#fdd',
  },
  value: {
    fontSize: 22,
    color: '#222',
  },
  given: {
    fontWeight: 'bold',
    color: '#000',
  },
  errorText: {
    color: '#c00',
  },
});
