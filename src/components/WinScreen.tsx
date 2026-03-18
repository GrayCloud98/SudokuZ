import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as G from '../logic/generator';

interface Props {
  onNewGame: (difficulty: G.Difficulty) => void;
}

export function WinScreen({ onNewGame }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>You Won!</Text>
      <Text style={styles.subtitle}>Start a new game</Text>
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.button} onPress={() => onNewGame('easy')}>
          <Text style={styles.buttonText}>Easy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => onNewGame('medium')}>
          <Text style={styles.buttonText}>Medium</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => onNewGame('hard')}>
          <Text style={styles.buttonText}>Hard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
  },
});
