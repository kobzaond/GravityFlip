import React, {useEffect, useRef, useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions} from 'react-native';

const {width: W, height: H} = Dimensions.get('window');

function FloatingParticle({delay, x, size, color}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {toValue: 1, duration: 4000 + Math.random() * 3000, useNativeDriver: true}),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = anim.interpolate({inputRange: [0, 1], outputRange: [H + 20, -20]});
  const opacity = anim.interpolate({inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 0.7, 0.7, 0]});

  return (
    <Animated.View style={{
      position: 'absolute', left: x, width: size, height: size,
      borderRadius: size / 2, backgroundColor: color,
      transform: [{translateY}], opacity,
    }} />
  );
}

function PulsingRing({size, delay, color}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {toValue: 1, duration: 3000, useNativeDriver: true}),
      ]),
    ).start();
  }, []);

  const scale = anim.interpolate({inputRange: [0, 1], outputRange: [0.8, 1.3]});
  const opacity = anim.interpolate({inputRange: [0, 0.3, 1], outputRange: [0.4, 0.15, 0]});

  return (
    <Animated.View style={{
      position: 'absolute', width: size, height: size, borderRadius: size / 2,
      borderWidth: 1.5, borderColor: color, alignSelf: 'center', top: H * 0.3 - size / 2,
      transform: [{scale}], opacity,
    }} />
  );
}

export default function Menu({onStart, highScore}) {
  const titleAnim = useRef(new Animated.Value(0)).current;
  const btnAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(titleAnim, {toValue: 1, duration: 800, useNativeDriver: true}),
      Animated.spring(btnAnim, {toValue: 1, friction: 4, useNativeDriver: true}),
    ]).start();
  }, []);

  const particles = Array.from({length: 15}, (_, i) => ({
    x: Math.random() * W,
    size: 3 + Math.random() * 5,
    color: ['#7df9ff', '#ff006e', '#8338ec', '#3a86ff'][i % 4],
    delay: Math.random() * 4000,
  }));

  return (
    <View style={styles.container}>
      {/* Background particles */}
      {particles.map((p, i) => <FloatingParticle key={i} {...p} />)}

      {/* Pulsing rings */}
      <PulsingRing size={200} delay={0} color="#8338ec" />
      <PulsingRing size={260} delay={500} color="#3a86ff" />
      <PulsingRing size={320} delay={1000} color="#ff006e" />

      {/* Orb */}
      <Animated.View style={[styles.orbContainer, {opacity: titleAnim}]}>
        <View style={styles.orbGlow} />
        <View style={styles.orb}>
          <View style={styles.orbSpecular} />
        </View>
      </Animated.View>

      {/* Title */}
      <Animated.View style={{opacity: titleAnim, transform: [{translateY: titleAnim.interpolate({inputRange: [0, 1], outputRange: [-30, 0]})}]}}>
        <Text style={styles.title}>GRAVITY</Text>
        <Text style={styles.titleFlip}>FLIP</Text>
      </Animated.View>

      {/* Play button */}
      <Animated.View style={{transform: [{scale: btnAnim}]}}>
        <TouchableOpacity style={styles.playButton} onPress={onStart} activeOpacity={0.7}>
          <View style={styles.playButtonInner}>
            <Text style={styles.playText}>ENTER THE RIFT</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {highScore > 0 && (
        <View style={styles.highScoreContainer}>
          <Text style={styles.highScoreLabel}>DIMENSIONAL RECORD</Text>
          <Text style={styles.highScore}>{highScore}</Text>
        </View>
      )}

      <Text style={styles.hint}>tap anywhere to flip gravity</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#05020f',
  },
  orbContainer: {
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#7df9ff',
    opacity: 0.15,
  },
  orb: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#00b4d8',
    shadowColor: '#7df9ff',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 20,
  },
  orbSpecular: {
    width: 22,
    height: 16,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.7)',
    marginTop: 14,
    marginLeft: 16,
  },
  title: {
    fontSize: 56,
    fontWeight: '900',
    color: '#7df9ff',
    letterSpacing: 10,
    textAlign: 'center',
    textShadowColor: '#7df9ff',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 20,
  },
  titleFlip: {
    fontSize: 56,
    fontWeight: '900',
    color: '#ff006e',
    letterSpacing: 10,
    textAlign: 'center',
    marginTop: -8,
    textShadowColor: '#ff006e',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 20,
  },
  playButton: {
    marginTop: 50,
    borderRadius: 30,
    overflow: 'hidden',
  },
  playButtonInner: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#8338ec',
    backgroundColor: 'rgba(131,56,236,0.15)',
  },
  playText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 3,
  },
  highScoreContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  highScoreLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 3,
  },
  highScore: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffd740',
    marginTop: 4,
  },
  hint: {
    position: 'absolute',
    bottom: 50,
    fontSize: 13,
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 2,
  },
});
