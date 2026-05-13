import React, {useEffect, useRef} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions} from 'react-native';

const {width: W} = Dimensions.get('window');

export default function GameOver({score, highScore, onRestart, onMenu}) {
  const isNewBest = score >= highScore && score > 0;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const scoreScale = useRef(new Animated.Value(0)).current;
  const shakeX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Screen shake on death
    Animated.sequence([
      Animated.timing(shakeX, {toValue: 15, duration: 50, useNativeDriver: true}),
      Animated.timing(shakeX, {toValue: -15, duration: 50, useNativeDriver: true}),
      Animated.timing(shakeX, {toValue: 10, duration: 50, useNativeDriver: true}),
      Animated.timing(shakeX, {toValue: -10, duration: 50, useNativeDriver: true}),
      Animated.timing(shakeX, {toValue: 0, duration: 50, useNativeDriver: true}),
    ]).start();

    Animated.sequence([
      Animated.timing(fadeIn, {toValue: 1, duration: 500, useNativeDriver: true}),
      Animated.spring(scoreScale, {toValue: 1, friction: 3, tension: 80, useNativeDriver: true}),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.container, {transform: [{translateX: shakeX}]}]}>
      {/* Shattered rift effect */}
      <View style={styles.riftLines}>
        {Array.from({length: 8}, (_, i) => (
          <View key={i} style={[styles.riftLine, {
            transform: [{rotate: `${i * 45}deg`}],
            backgroundColor: i % 2 === 0 ? '#ff006e' : '#8338ec',
            opacity: 0.2 + Math.random() * 0.2,
          }]} />
        ))}
      </View>

      <Animated.View style={{opacity: fadeIn}}>
        {isNewBest && (
          <Text style={styles.newBest}>DIMENSION BREACHED</Text>
        )}
        <Text style={styles.collapsed}>COLLAPSED</Text>
      </Animated.View>

      <Animated.View style={{transform: [{scale: scoreScale}], alignItems: 'center'}}>
        <Text style={styles.score}>{score}</Text>
        <Text style={styles.label}>distance traveled</Text>
      </Animated.View>

      {!isNewBest && highScore > 0 && (
        <Animated.View style={{opacity: fadeIn}}>
          <Text style={styles.highScore}>record: {highScore}</Text>
        </Animated.View>
      )}

      <Animated.View style={{opacity: fadeIn}}>
        <TouchableOpacity style={styles.retryButton} onPress={onRestart} activeOpacity={0.7}>
          <Text style={styles.retryText}>RE-ENTER</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton} onPress={onMenu} activeOpacity={0.7}>
          <Text style={styles.menuText}>EXIT RIFT</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#05020f',
  },
  riftLines: {
    position: 'absolute',
    width: W,
    height: W,
    justifyContent: 'center',
    alignItems: 'center',
  },
  riftLine: {
    position: 'absolute',
    width: 1.5,
    height: W * 0.8,
  },
  newBest: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffd740',
    letterSpacing: 4,
    marginBottom: 10,
    textAlign: 'center',
  },
  collapsed: {
    fontSize: 48,
    fontWeight: '900',
    color: '#ff006e',
    letterSpacing: 6,
    textAlign: 'center',
    textShadowColor: '#ff006e',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 30,
  },
  score: {
    fontSize: 96,
    fontWeight: '900',
    color: '#fff',
    marginTop: 30,
    textShadowColor: '#7df9ff',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 15,
  },
  label: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 3,
    marginTop: 4,
  },
  highScore: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 16,
    letterSpacing: 2,
  },
  retryButton: {
    marginTop: 50,
    paddingHorizontal: 50,
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#7df9ff',
    backgroundColor: 'rgba(125,249,255,0.1)',
  },
  retryText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#7df9ff',
    letterSpacing: 4,
    textAlign: 'center',
  },
  menuButton: {
    marginTop: 20,
    paddingVertical: 14,
  },
  menuText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 3,
    textAlign: 'center',
  },
});
