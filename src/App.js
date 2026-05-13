import React, {useState} from 'react';
import {View, StyleSheet} from 'react-native';
import {StatusBar} from 'expo-status-bar';
import Game from './Game';
import Menu from './Menu';
import GameOver from './GameOver';

export default function App() {
  const [screen, setScreen] = useState('menu');
  const [lastScore, setLastScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const startGame = () => setScreen('playing');

  const endGame = (score) => {
    setLastScore(score);
    if (score > highScore) setHighScore(score);
    setScreen('gameover');
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      {screen === 'menu' && <Menu onStart={startGame} highScore={highScore} />}
      {screen === 'playing' && <Game onGameOver={endGame} />}
      {screen === 'gameover' && (
        <GameOver score={lastScore} highScore={highScore} onRestart={startGame} onMenu={() => setScreen('menu')} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05020f',
  },
});
