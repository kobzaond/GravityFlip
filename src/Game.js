import React, {useEffect, useRef, useState, useCallback} from 'react';
import {View, StyleSheet, Dimensions, TouchableWithoutFeedback, Text, Animated} from 'react-native';

const {width: W, height: H} = Dimensions.get('window');
const BALL_R = 10;
const TUBE_PAD = 50;
const TUBE_TOP = TUBE_PAD;
const TUBE_BOT = H - TUBE_PAD;
const TUBE_H = TUBE_BOT - TUBE_TOP;
const GRAVITY = 0.55;
const FLIP_IMPULSE = -11;
const BASE_SPEED = 2.8;
const TRAIL_FREQ = 6;
const OBS_BASE_INTERVAL = 130;
const OBS_W = 22;
const BALL_X = 70;

const PHASES = [
  {bg: '#05020f', accent: '#7df9ff', obstacle: '#8338ec', trail: '#7df9ff'},
  {bg: '#0a0015', accent: '#a855f7', obstacle: '#ff006e', trail: '#a855f7'},
  {bg: '#0f0a00', accent: '#ffd740', obstacle: '#ff6b35', trail: '#ffd740'},
  {bg: '#000a0f', accent: '#3a86ff', obstacle: '#06d6a0', trail: '#3a86ff'},
  {bg: '#0f000a', accent: '#ff006e', obstacle: '#ffd740', trail: '#ff006e'},
];

function getPhase(score) {
  return PHASES[Math.floor(score / 8) % PHASES.length];
}

export default function Game({onGameOver}) {
  const [, forceRender] = useState(0);
  const flipAnim = useRef(new Animated.Value(0)).current;

  const g = useRef({
    ballY: TUBE_H / 2,
    vel: 0,
    gDir: 1,
    obs: [],
    trail: [],
    ghostTrail: [],
    particles: [],
    score: 0,
    frame: 0,
    speed: BASE_SPEED,
    running: true,
    passed: new Set(),
    flipCount: 0,
    lastFlipFrame: 0,
  }).current;

  const animRef = useRef(null);

  const spawnParticles = (y, dir) => {
    for (let i = 0; i < 6; i++) {
      g.particles.push({
        x: BALL_X,
        y: y,
        vx: -1 - Math.random() * 3,
        vy: dir * (1 + Math.random() * 3),
        life: 1,
        size: 2 + Math.random() * 4,
      });
    }
  };

  const loop = useCallback(() => {
    if (!g.running) return;
    g.frame++;

    // Physics
    g.vel += GRAVITY * g.gDir;
    g.vel *= 0.97;
    g.ballY += g.vel;

    // Boundaries
    if (g.ballY < BALL_R) { g.ballY = BALL_R; g.vel = 0; }
    if (g.ballY > TUBE_H - BALL_R) { g.ballY = TUBE_H - BALL_R; g.vel = 0; }

    // Speed
    g.speed = BASE_SPEED + g.score * 0.06;

    // Obstacles
    const interval = Math.max(55, OBS_BASE_INTERVAL - g.score * 1.8);
    if (g.frame % Math.floor(interval) === 0) {
      const gapSize = Math.max(70, 150 - g.score * 1.5);
      const gapY = 30 + Math.random() * (TUBE_H - gapSize - 60);
      g.obs.push({x: W + OBS_W, gapY, gapSize, id: g.frame});
    }

    // Move obstacles
    g.obs = g.obs.filter(o => { o.x -= g.speed; return o.x > -OBS_W; });

    // Score
    g.obs.forEach(o => {
      if (o.x + OBS_W < BALL_X && !g.passed.has(o.id)) {
        g.passed.add(o.id);
        g.score++;
      }
    });

    // Trail
    if (g.frame % TRAIL_FREQ === 0) {
      g.trail.push({x: BALL_X, y: g.ballY});
    }
    g.trail = g.trail.filter(t => { t.x -= g.speed; return t.x > -10; });

    // Ghost trail (old path comes back)
    if (g.frame % 600 === 0 && g.trail.length > 8) {
      const ghosts = g.trail.slice(0, 12).map(t => ({...t, x: t.x + W + 200}));
      g.ghostTrail.push(...ghosts);
    }
    g.ghostTrail = g.ghostTrail.filter(t => { t.x -= g.speed * 0.4; return t.x > -10; });

    // Particles
    g.particles = g.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.03;
      return p.life > 0;
    });

    // Collision - obstacles
    for (const o of g.obs) {
      if (BALL_X + BALL_R > o.x && BALL_X - BALL_R < o.x + OBS_W) {
        if (g.ballY - BALL_R < o.gapY || g.ballY + BALL_R > o.gapY + o.gapSize) {
          g.running = false;
          onGameOver(g.score);
          return;
        }
      }
    }

    // Collision - ghost trail
    for (const t of g.ghostTrail) {
      const dx = BALL_X - t.x;
      const dy = g.ballY - t.y;
      if (dx * dx + dy * dy < (BALL_R + 6) * (BALL_R + 6)) {
        g.running = false;
        onGameOver(g.score);
        return;
      }
    }

    forceRender(f => f + 1);
    animRef.current = requestAnimationFrame(loop);
  }, [onGameOver]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(loop);
    return () => { g.running = false; cancelAnimationFrame(animRef.current); };
  }, [loop]);

  const handleTap = () => {
    if (!g.running) return;
    g.gDir *= -1;
    g.vel = FLIP_IMPULSE * g.gDir;
    g.flipCount++;
    g.lastFlipFrame = g.frame;
    spawnParticles(g.ballY, g.gDir);

    Animated.sequence([
      Animated.timing(flipAnim, {toValue: 1, duration: 80, useNativeDriver: true}),
      Animated.timing(flipAnim, {toValue: 0, duration: 200, useNativeDriver: true}),
    ]).start();
  };

  const phase = getPhase(g.score);
  const flipGlow = flipAnim.interpolate({inputRange: [0, 1], outputRange: [0, 0.3]});

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <View style={[styles.container, {backgroundColor: phase.bg}]}>
        {/* Flip flash overlay */}
        <Animated.View style={[styles.flashOverlay, {opacity: flipGlow, backgroundColor: phase.accent}]} />

        {/* Tube borders - glowing lines */}
        <View style={[styles.tubeLine, {top: TUBE_TOP, backgroundColor: phase.accent, shadowColor: phase.accent}]} />
        <View style={[styles.tubeLine, {top: TUBE_BOT, backgroundColor: phase.accent, shadowColor: phase.accent}]} />

        {/* Background grid (subtle) */}
        {Array.from({length: 8}, (_, i) => (
          <View key={`grid-${i}`} style={[styles.gridLine, {
            top: TUBE_TOP + (TUBE_H / 8) * (i + 1),
            opacity: 0.04,
            backgroundColor: phase.accent,
          }]} />
        ))}

        {/* Obstacles with glow */}
        {g.obs.map(o => (
          <React.Fragment key={o.id}>
            <View style={[styles.obsTop, {
              left: o.x, top: TUBE_TOP, height: o.gapY,
              backgroundColor: phase.obstacle,
              shadowColor: phase.obstacle,
            }]} />
            <View style={[styles.obsBot, {
              left: o.x, top: TUBE_TOP + o.gapY + o.gapSize,
              height: TUBE_H - o.gapY - o.gapSize,
              backgroundColor: phase.obstacle,
              shadowColor: phase.obstacle,
            }]} />
            {/* Gap indicators */}
            <View style={[styles.gapGlow, {
              left: o.x - 2, top: TUBE_TOP + o.gapY,
              height: o.gapSize, borderColor: phase.obstacle,
            }]} />
          </React.Fragment>
        ))}

        {/* Trail - fading ribbon */}
        {g.trail.map((t, i) => {
          const progress = i / Math.max(g.trail.length, 1);
          return (
            <View key={`t-${i}`} style={{
              position: 'absolute',
              left: t.x - 3,
              top: TUBE_TOP + t.y - 3,
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: phase.trail,
              opacity: 0.1 + progress * 0.4,
            }} />
          );
        })}

        {/* Ghost trail (danger) */}
        {g.ghostTrail.map((t, i) => (
          <View key={`g-${i}`} style={{
            position: 'absolute',
            left: t.x - 7,
            top: TUBE_TOP + t.y - 7,
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: '#ff006e',
            opacity: 0.6,
            shadowColor: '#ff006e',
            shadowRadius: 6,
            shadowOpacity: 0.8,
            elevation: 4,
          }} />
        ))}

        {/* Particles */}
        {g.particles.map((p, i) => (
          <View key={`p-${i}`} style={{
            position: 'absolute',
            left: p.x - p.size / 2,
            top: TUBE_TOP + p.y - p.size / 2,
            width: p.size,
            height: p.size,
            borderRadius: p.size / 2,
            backgroundColor: phase.accent,
            opacity: p.life,
          }} />
        ))}

        {/* Ball glow */}
        <View style={{
          position: 'absolute',
          left: BALL_X - 25,
          top: TUBE_TOP + g.ballY - 25,
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: phase.accent,
          opacity: 0.15,
        }} />

        {/* Ball */}
        <View style={[styles.ball, {
          left: BALL_X - BALL_R,
          top: TUBE_TOP + g.ballY - BALL_R,
          backgroundColor: phase.accent,
          shadowColor: phase.accent,
        }]}>
          <View style={styles.ballSpec} />
        </View>

        {/* Score */}
        <Text style={[styles.score, {color: phase.accent}]}>{g.score}</Text>

        {/* Phase indicator */}
        <View style={[styles.phaseBar, {backgroundColor: phase.accent}]}>
          <View style={[styles.phaseProgress, {
            width: `${((g.score % 8) / 8) * 100}%`,
            backgroundColor: phase.obstacle,
          }]} />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    pointerEvents: 'none',
  },
  tubeLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  obsTop: {
    position: 'absolute',
    width: OBS_W,
    borderRadius: 4,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  obsBot: {
    position: 'absolute',
    width: OBS_W,
    borderRadius: 4,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  gapGlow: {
    position: 'absolute',
    width: OBS_W + 4,
    borderWidth: 1,
    borderRadius: 4,
    opacity: 0.2,
  },
  ball: {
    position: 'absolute',
    width: BALL_R * 2,
    height: BALL_R * 2,
    borderRadius: BALL_R,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 10,
  },
  ballSpec: {
    width: 6,
    height: 4,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    marginLeft: 5,
  },
  score: {
    position: 'absolute',
    top: 15,
    width: '100%',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 4,
    opacity: 0.5,
  },
  phaseBar: {
    position: 'absolute',
    bottom: 20,
    left: W * 0.3,
    right: W * 0.3,
    height: 3,
    borderRadius: 1.5,
    opacity: 0.2,
    overflow: 'hidden',
  },
  phaseProgress: {
    height: '100%',
    borderRadius: 1.5,
  },
});
