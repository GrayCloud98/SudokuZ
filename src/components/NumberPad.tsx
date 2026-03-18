import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as B from '../logic/board';

interface Props {
  onNumberPress: (num: B.CellValue) => void;
  onErase: () => void;
}

export function NumberPad({ onNumberPress, onErase }: Props) {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5, 6].map((num) => (
        <TouchableOpacity
          key={num}
          style={styles.button}
          onPress={() => onNumberPress(num as B.CellValue)}
        >
          <Text style={styles.buttonText}>{num}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={[styles.button, styles.eraseButton]} onPress={onErase}>
        <Text style={styles.buttonText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 24,
    gap: 10,
  },
  button: {
    width: 55,
    height: 55,
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  eraseButton: {
    borderColor: '#c00',
  },
  buttonText: {
    fontSize: 22,
    color: '#222',
  },
});
