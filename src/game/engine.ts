import {
  BallEntity,
  Difficulty,
  FloatingPopup,
  HudSnapshot,
  InputState,
  MatchConfig,
  MatchState,
  Particle,
  PlayerEntity,
  PlayerRole,
  SuperShotType,
  TEAMS,
  TeamConfig,
} from './types';

export const PITCH_W = 1040;
export const PITCH_H = 600;
export const GOAL_TOP = 215;
export const GOAL_BOTTOM = 385;
export const GOAL_HEIGHT = GOAL_BOTTOM - GOAL_TOP;
export const GOAL_DEPTH = 48;
export const GOAL_CROSSBAR_Z = 58;
export const PLAYER_RADIUS = 16;
export const BALL_RADIUS = 10;
export const GRAVITY = 680;

const PARTICLE_POOL_SIZE = 140;
const POPUP_POOL_SIZE = 16;
const TRAIL_LEN = 14;

export function getTeamConfig(id: string): TeamConfig {
  return TEAMS.find((t) => t.id === id) ?? TEAMS[0];
}

function createEmptyParticles(): Particle[] {
  const arr: Particle[] = [];
  for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
    arr.push({
      active: false,
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      life: 0,
      maxLife: 0.4,
      size: 3,
      color: '#ffffff',
    });
  }
  return arr;
}

function createEmptyPopups(): FloatingPopup[] {
  const arr: FloatingPopup[] = [];
  for (let i = 0; i < POPUP_POOL_SIZE; i++) {
    arr.push({
      active: false,
      text: '',
      x: 0,
      y: 0,
      vy: 0,
      life: 0,
      maxLife: 0.9,
      color: '#facc15',
      scale: 1,
    });
  }
  return arr;
}

function createBall(): BallEntity {
  return {
    x: PITCH_W / 2,
    y: PITCH_H / 2,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    ownerId: null,
    lastTouchTeam: null,
    pickupCooldown: 0,
    spin: 0,
    superType: null,
    superTimer: 0,
    superCurveDir: 1,
    trailIndex: 0,
    trailX: new Float32Array(TRAIL_LEN),
    trailY: new Float32Array(TRAIL_LEN),
    trailZ: new Float32Array(TRAIL_LEN),
  };
}

function createTeamPlayers(team: 0 | 1, config: TeamConfig): PlayerEntity[] {
  const specs: Array<{ role: PlayerRole; num: number; rx: number; ry: number; cap: boolean }> = [
    { role: 'GK', num: 1, rx: 40, ry: PITCH_H / 2, cap: false },
    { role: 'DF', num: 4, rx: 235, ry: PITCH_H / 2, cap: false },
    { role: 'MF', num: 8, rx: 390, ry: PITCH_H * 0.28, cap: false },
    { role: 'FW', num: 10, rx: 470, ry: PITCH_H * 0.65, cap: true },
  ];

  return specs.map((s, idx) => {
    const id = team * 4 + idx;
    const x = team === 0 ? s.rx : PITCH_W - s.rx;
    const y = team === 0 ? s.ry : PITCH_H - s.ry;
    const roleBonus = s.role === 'FW' ? 1.05 : s.role === 'GK' ? 0.94 : 1.0;
    return {
      id,
      team,
      role: s.role,
      number: s.num,
      x,
      y,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      homeX: x,
      homeY: y,
      facingX: team === 0 ? 1 : -1,
      facingY: 0,
      walkPhase: 0,
      stamina: 100,
      speedStat: (config.speedRating / 88) * roleBonus,
      powerStat: (config.powerRating / 88) * (s.cap ? 1.08 : 1.0),
      stunTimer: 0,
      tackleTimer: 0,
      tackleCooldown: 0,
      kickAnimTimer: 0,
      hitFlashTimer: 0,
      squashX: 1,
      squashY: 1,
      diveDirY: 0,
      aiCooldown: 0,
      isCaptain: s.cap,
    };
  });
}

export function createMatchState(config: MatchConfig): MatchState {
  const homeTeam = getTeamConfig(config.homeTeamId);
  const awayTeam = getTeamConfig(config.awayTeamId);
  const players = [...createTeamPlayers(0, homeTeam), ...createTeamPlayers(1, awayTeam)];

  const state: MatchState = {
    config,
    phase: 'kickoff',
    phaseTimer: config.attractMode ? 0.3 : 1.0,
    timeRemaining: config.durationSec,
    scoreHome: 0,
    scoreAway: 0,
    lastScorerTeam: null,
    superGaugeHome: config.attractMode ? 80 : 35,
    superGaugeAway: config.attractMode ? 80 : 25,
    activeHomeId: 3, // Home FW captain
    shotCharge: 0,
    isChargingShot: false,
    hitstopTimer: 0,
    cameraX: PITCH_W / 2,
    cameraY: PITCH_H / 2,
    trauma: 0,
    netRippleLeft: 0,
    netRippleRight: 0,
    players,
    ball: createBall(),
    particles: createEmptyParticles(),
    particleCursor: 0,
    popups: createEmptyPopups(),
    popupCursor: 0,
    stats: {
      homeShots: 0,
      awayShots: 0,
      homeSuperShots: 0,
      awaySuperShots: 0,
      homeTackles: 0,
      awayTackles: 0,
    },
    events: ['whistle'],
  };

  resetPositionsForKickoff(state, 0);
  return state;
}

export function resetPositionsForKickoff(state: MatchState, kickoffTeam: 0 | 1): void {
  for (const p of state.players) {
    p.x = p.homeX;
    p.y = p.homeY;
    p.z = 0;
    p.vx = 0;
    p.vy = 0;
    p.vz = 0;
    p.stunTimer = 0;
    p.tackleTimer = 0;
    p.tackleCooldown = 0;
    p.kickAnimTimer = 0;
    p.hitFlashTimer = 0;
    p.squashX = 1;
    p.squashY = 1;
    p.diveDirY = 0;
    p.facingX = p.team === 0 ? 1 : -1;
    p.facingY = 0;
    p.stamina = 100;
  }

  // Place kickoff striker near center spot, and push opposing FW outside center circle
  for (const p of state.players) {
    if (p.team === kickoffTeam && p.role === 'FW') {
      p.x = kickoffTeam === 0 ? PITCH_W / 2 - 14 : PITCH_W / 2 + 14;
      p.y = PITCH_H / 2;
      if (kickoffTeam === 0) state.activeHomeId = p.id;
    } else if (p.team !== kickoffTeam && p.role === 'FW') {
      p.x = p.team === 0 ? PITCH_W / 2 - 96 : PITCH_W / 2 + 96;
      p.y = PITCH_H / 2;
      p.aiCooldown = 1.1;
    }
  }

  state.ball.x = PITCH_W / 2;
  state.ball.y = PITCH_H / 2;
  state.ball.z = 0;
  state.ball.vx = 0;
  state.ball.vy = 0;
  state.ball.vz = 0;
  state.ball.ownerId = null;
  state.ball.pickupCooldown = 0;
  state.ball.superType = null;
  state.ball.superTimer = 0;
  state.ball.trailX.fill(PITCH_W / 2);
  state.ball.trailY.fill(PITCH_H / 2);
  state.ball.trailZ.fill(0);
  state.shotCharge = 0;
  state.isChargingShot = false;
}

export function spawnParticle(
  state: MatchState,
  x: number,
  y: number,
  z: number,
  vx: number,
  vy: number,
  vz: number,
  color: string,
  size = 4,
  maxLife = 0.42
): void {
  const p = state.particles[state.particleCursor];
  state.particleCursor = (state.particleCursor + 1) % PARTICLE_POOL_SIZE;
  p.active = true;
  p.x = x;
  p.y = y;
  p.z = z;
  p.vx = vx;
  p.vy = vy;
  p.vz = vz;
  p.life = maxLife;
  p.maxLife = maxLife;
  p.size = size;
  p.color = color;
}

export function spawnPopup(
  state: MatchState,
  text: string,
  x: number,
  y: number,
  color = '#facc15',
  scale = 1
): void {
  const pop = state.popups[state.popupCursor];
  state.popupCursor = (state.popupCursor + 1) % POPUP_POOL_SIZE;
  pop.active = true;
  pop.text = text;
  pop.x = x;
  pop.y = y;
  pop.vy = -42;
  pop.life = 0.95;
  pop.maxLife = 0.95;
  pop.color = color;
  pop.scale = scale;
}

function spawnBurst(
  state: MatchState,
  x: number,
  y: number,
  z: number,
  count: number,
  color: string,
  speed = 160,
  size = 4
): void {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
    const spd = speed * (0.5 + Math.random() * 0.7);
    spawnParticle(
      state,
      x,
      y,
      z,
      Math.cos(angle) * spd,
      Math.sin(angle) * spd,
      40 + Math.random() * 120,
      color,
      size,
      0.32 + Math.random() * 0.25
    );
  }
}

function getDifficultyParams(diff: Difficulty) {
  switch (diff) {
    case 'rookie':
      return { aiSpeedMult: 0.76, tackleRate: 0.35, gkSaveRadius: 50, shootAccuracy: 0.65 };
    case 'legend':
      return { aiSpeedMult: 1.02, tackleRate: 0.85, gkSaveRadius: 62, shootAccuracy: 0.94 };
    case 'hotblood':
    default:
      return { aiSpeedMult: 0.9, tackleRate: 0.58, gkSaveRadius: 58, shootAccuracy: 0.82 };
  }
}

export function selectNearestPlayer(state: MatchState, team: 0 | 1, excludeId?: number): PlayerEntity | null {
  let best: PlayerEntity | null = null;
  let bestDist = Infinity;
  for (const p of state.players) {
    if (p.team !== team || p.role === 'GK' || p.id === excludeId) continue;
    const dx = p.x - state.ball.x;
    const dy = p.y - state.ball.y;
    const d = dx * dx + dy * dy;
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  return best;
}

export function triggerPass(state: MatchState, passer: PlayerEntity, aimX: number, aimY: number): void {
  const teammates = state.players.filter((p) => p.team === passer.team && p.id !== passer.id);
  let target: PlayerEntity | null = null;
  let bestScore = -Infinity;

  const hasAim = Math.hypot(aimX, aimY) > 0.2;
  const dirX = hasAim ? aimX : passer.facingX;
  const dirY = hasAim ? aimY : passer.facingY;
  const dirLen = Math.hypot(dirX, dirY) || 1;
  const nx = dirX / dirLen;
  const ny = dirY / dirLen;

  for (const mate of teammates) {
    if (mate.stunTimer > 0) continue;
    const dx = mate.x - passer.x;
    const dy = mate.y - passer.y;
    const dist = Math.hypot(dx, dy) || 1;
    const dot = (dx / dist) * nx + (dy / dist) * ny;
    // Favor aligned teammates at medium range
    const score = dot * 2.2 - dist / 900 + (mate.role === 'GK' ? -0.9 : 0);
    if (score > bestScore) {
      bestScore = score;
      target = mate;
    }
  }

  const b = state.ball;
  b.ownerId = null;
  b.pickupCooldown = 0.16;
  b.superType = null;
  b.superTimer = 0;

  if (target) {
    const leadX = target.x + target.vx * 0.22;
    const leadY = target.y + target.vy * 0.22;
    const dx = leadX - b.x;
    const dy = leadY - b.y;
    const dist = Math.hypot(dx, dy) || 1;
    const passSpeed = Math.min(540, Math.max(360, dist * 1.45));
    b.vx = (dx / dist) * passSpeed;
    b.vy = (dy / dist) * passSpeed;
    b.vz = 70;
    if (passer.team === 0 && target.role !== 'GK') {
      state.activeHomeId = target.id;
    }
  } else {
    b.vx = nx * 420;
    b.vy = ny * 420;
    b.vz = 65;
  }

  passer.kickAnimTimer = 0.22;
  passer.squashX = 1.2;
  passer.squashY = 0.82;
  if (passer.team === 0) state.superGaugeHome = Math.min(100, state.superGaugeHome + 8);
  else state.superGaugeAway = Math.min(100, state.superGaugeAway + 8);
  state.events.push('pass');
}

export function triggerShot(
  state: MatchState,
  shooter: PlayerEntity,
  charge: number,
  aimY: number,
  forceSuper = false
): void {
  const b = state.ball;
  const teamCfg = getTeamConfig(shooter.team === 0 ? state.config.homeTeamId : state.config.awayTeamId);
  const gauge = shooter.team === 0 ? state.superGaugeHome : state.superGaugeAway;
  const isSuper = forceSuper || (gauge >= 100 && charge >= 0.6);

  const targetGoalX = shooter.team === 0 ? PITCH_W + 10 : -10;
  const clampedAimY = Math.max(-1, Math.min(1, aimY));
  const targetGoalY = PITCH_H / 2 + clampedAimY * (GOAL_HEIGHT * 0.42);

  const dx = targetGoalX - b.x;
  const dy = targetGoalY - b.y;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = dx / dist;
  const ny = dy / dist;

  b.ownerId = null;
  b.pickupCooldown = 0.22;
  b.lastTouchTeam = shooter.team;

  if (isSuper) {
    const superType: SuperShotType = teamCfg.superType;
    b.superType = superType;
    b.superTimer = 1.35;
    b.superCurveDir = b.y < PITCH_H / 2 ? 1 : -1;

    const superSpeed =
      superType === 'thunder' ? 890 : superType === 'dragon' ? 790 : superType === 'phantom' ? 740 : 690;
    b.vx = nx * superSpeed;
    b.vy = ny * superSpeed;
    b.vz = superType === 'banana' ? 140 : 95;

    if (shooter.team === 0) {
      state.superGaugeHome = 0;
      state.stats.homeShots += 1;
      state.stats.homeSuperShots += 1;
    } else {
      state.superGaugeAway = 0;
      state.stats.awayShots += 1;
      state.stats.awaySuperShots += 1;
    }

    state.hitstopTimer = 0.065;
    state.trauma = Math.min(1, state.trauma + 0.72);
    shooter.hitFlashTimer = 0.12;
    spawnBurst(state, b.x, b.y, b.z + 6, 20, teamCfg.primaryColor, 260, 5);
    spawnPopup(state, teamCfg.superName + '!', shooter.x, shooter.y - 36, '#fde047', 1.25);
    state.events.push('super_shot');
  } else {
    const power = 480 + charge * 260 * shooter.powerStat;
    b.superType = null;
    b.superTimer = 0;
    b.vx = nx * power;
    b.vy = ny * power;
    b.vz = 90 + charge * 125;

    if (shooter.team === 0) {
      state.stats.homeShots += 1;
      state.superGaugeHome = Math.min(100, state.superGaugeHome + 12);
    } else {
      state.stats.awayShots += 1;
      state.superGaugeAway = Math.min(100, state.superGaugeAway + 12);
    }

    state.trauma = Math.min(1, state.trauma + 0.16 + charge * 0.18);
    spawnBurst(state, b.x, b.y, b.z + 4, 8, '#ffffff', 140, 3);
    state.events.push('kick');
  }

  shooter.facingX = nx;
  shooter.facingY = ny;
  shooter.kickAnimTimer = 0.28;
  shooter.squashX = 1.28;
  shooter.squashY = 0.76;
  state.shotCharge = 0;
  state.isChargingShot = false;
}

export function triggerTackle(state: MatchState, tackler: PlayerEntity): void {
  if (tackler.tackleCooldown > 0 || tackler.stunTimer > 0) return;
  const len = Math.hypot(tackler.facingX, tackler.facingY) || 1;
  const nx = tackler.facingX / len;
  const ny = tackler.facingY / len;
  tackler.tackleTimer = 0.32;
  tackler.tackleCooldown = 0.78;
  tackler.vx = nx * 425;
  tackler.vy = ny * 425;
  tackler.squashX = 1.28;
  tackler.squashY = 0.74;
  spawnBurst(state, tackler.x, tackler.y, 2, 6, '#d6d3d1', 100, 3);
  state.events.push('tackle');
}

export function stepMatch(state: MatchState, input: InputState, rawDt: number): void {
  const dt = Math.min(Math.max(rawDt, 0), 0.05);
  state.events.length = 0;

  // Decay visual timers even during hitstop
  state.trauma = Math.max(0, state.trauma - dt * 1.9);
  state.netRippleLeft = Math.max(0, state.netRippleLeft - dt * 2.5);
  state.netRippleRight = Math.max(0, state.netRippleRight - dt * 2.5);
  updateParticlesAndPopups(state, dt);

  if (state.hitstopTimer > 0) {
    state.hitstopTimer = Math.max(0, state.hitstopTimer - dt);
    return;
  }

  if (state.phase === 'fulltime') {
    return;
  }

  if (state.phase === 'kickoff') {
    state.phaseTimer -= dt;
    if (state.phaseTimer <= 0) {
      state.phase = 'live';
      state.events.push('whistle');
    }
    updateCamera(state, dt);
    return;
  }

  if (state.phase === 'goal') {
    state.phaseTimer -= dt;
    stepBallPhysics(state, dt);
    if (state.phaseTimer <= 0) {
      const concededTeam: 0 | 1 = state.lastScorerTeam === 0 ? 1 : 0;
      resetPositionsForKickoff(state, concededTeam);
      state.phase = 'kickoff';
      state.phaseTimer = state.config.attractMode ? 0.35 : 0.9;
      state.events.push('whistle');
    }
    updateCamera(state, dt);
    return;
  }

  // Live match clock
  if (!state.config.attractMode) {
    state.timeRemaining = Math.max(0, state.timeRemaining - dt);
    if (state.timeRemaining <= 0) {
      state.phase = 'fulltime';
      state.events.push('whistle');
      return;
    }
  }

  // Passive super gauge gain
  state.superGaugeHome = Math.min(100, state.superGaugeHome + dt * 2.5);
  state.superGaugeAway = Math.min(100, state.superGaugeAway + dt * 1.6);

  // Auto-switch controlled Home player to carrier if a teammate catches the ball
  if (state.ball.ownerId !== null) {
    const owner = state.players[state.ball.ownerId];
    if (owner && owner.team === 0 && owner.role !== 'GK') {
      state.activeHomeId = owner.id;
    }
  }

  const diff = getDifficultyParams(state.config.difficulty);

  // Update players
  for (const p of state.players) {
    p.squashX += (1 - p.squashX) * Math.min(1, dt * 14);
    p.squashY += (1 - p.squashY) * Math.min(1, dt * 14);
    if (p.kickAnimTimer > 0) p.kickAnimTimer = Math.max(0, p.kickAnimTimer - dt);
    if (p.hitFlashTimer > 0) p.hitFlashTimer = Math.max(0, p.hitFlashTimer - dt);
    if (p.tackleCooldown > 0) p.tackleCooldown = Math.max(0, p.tackleCooldown - dt);
    if (p.aiCooldown > 0) p.aiCooldown = Math.max(0, p.aiCooldown - dt);

    // Z jump physics
    if (p.z > 0 || p.vz !== 0) {
      p.z += p.vz * dt;
      p.vz -= GRAVITY * dt;
      if (p.z <= 0) {
        p.z = 0;
        p.vz = 0;
        p.squashX = 1.18;
        p.squashY = 0.82;
      }
    }

    if (p.stunTimer > 0) {
      p.stunTimer = Math.max(0, p.stunTimer - dt);
      p.vx *= Math.pow(0.08, dt);
      p.vy *= Math.pow(0.08, dt);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      clampPlayerToPitch(p);
      continue;
    }

    if (p.tackleTimer > 0) {
      p.tackleTimer = Math.max(0, p.tackleTimer - dt);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.pow(0.25, dt);
      p.vy *= Math.pow(0.25, dt);
      clampPlayerToPitch(p);
      checkTackleCollisions(state, p);
      continue;
    }

    const isHumanControlled = !state.config.attractMode && p.id === state.activeHomeId;
    if (isHumanControlled) {
      updateHumanPlayer(state, p, input, dt);
    } else {
      updateAiPlayer(state, p, diff, dt);
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;
    const speed = Math.hypot(p.vx, p.vy);
    p.walkPhase += speed * dt * 0.08;
    clampPlayerToPitch(p);
  }

  // Soft player-player body separation
  resolvePlayerSeparations(state);

  // Step ball physics & pickup & goal detection
  stepBallPhysics(state, dt);
  checkBallOwnershipAndSaves(state, diff);
  checkGoalScored(state);

  updateCamera(state, dt);
}

function updateHumanPlayer(state: MatchState, p: PlayerEntity, input: InputState, dt: number): void {
  const hasBall = state.ball.ownerId === p.id;
  const moveMag = Math.hypot(input.moveX, input.moveY);
  const isDashing = input.dashHeld && p.stamina > 4 && moveMag > 0.15;

  if (isDashing) {
    p.stamina = Math.max(0, p.stamina - dt * 42);
  } else {
    p.stamina = Math.min(100, p.stamina + dt * 26);
  }

  const baseSpeed = 205 * p.speedStat * (isDashing ? 1.42 : 1.0) * (hasBall ? 0.93 : 1.0);
  if (moveMag > 0.08) {
    const nx = input.moveX / Math.max(1, moveMag);
    const ny = input.moveY / Math.max(1, moveMag);
    p.vx = nx * baseSpeed * Math.min(1, moveMag);
    p.vy = ny * baseSpeed * Math.min(1, moveMag);
    p.facingX = nx;
    p.facingY = ny;
  } else {
    p.vx *= Math.pow(0.001, dt);
    p.vy *= Math.pow(0.001, dt);
  }

  // Pass / Switch
  if (input.passJustPressed) {
    if (hasBall) {
      triggerPass(state, p, input.moveX, input.moveY);
    } else {
      const next = selectNearestPlayer(state, 0, p.id);
      if (next) state.activeHomeId = next.id;
    }
  }

  // Jump / Bicycle / Instant Super
  if (input.jumpSuperJustPressed) {
    const distToBall = Math.hypot(state.ball.x - p.x, state.ball.y - p.y);
    if (hasBall && state.superGaugeHome >= 100) {
      triggerShot(state, p, 1.0, input.moveY, true);
      return;
    }
    if (!hasBall && state.ball.ownerId === null && distToBall < 42 && state.ball.z > 8) {
      // Diving Header / Bicycle Kick!
      p.z = Math.max(p.z, 12);
      p.vz = 200;
      triggerShot(state, p, 0.9, input.moveY, state.superGaugeHome >= 100);
      spawnPopup(state, '倒钩凌空!', p.x, p.y - 30, '#38bdf8', 1.05);
      return;
    }
    if (p.z === 0) {
      p.vz = 255;
      p.squashX = 0.84;
      p.squashY = 1.2;
    }
  }

  // Shoot / Charge / Tackle
  if (hasBall) {
    if (input.shootJustPressed) {
      state.isChargingShot = true;
      state.shotCharge = 0.12;
    }
    if (state.isChargingShot && input.shootHeld) {
      state.shotCharge = Math.min(1, state.shotCharge + dt * 1.75);
    }
    if (state.isChargingShot && (input.shootJustReleased || !input.shootHeld)) {
      triggerShot(state, p, state.shotCharge, input.moveY);
    }
  } else {
    state.isChargingShot = false;
    state.shotCharge = 0;
    if (input.shootJustPressed) {
      triggerTackle(state, p);
    }
  }
}

function updateAiPlayer(
  state: MatchState,
  p: PlayerEntity,
  diff: ReturnType<typeof getDifficultyParams>,
  dt: number
): void {
  const b = state.ball;
  const hasBall = b.ownerId === p.id;
  const dirSign = p.team === 0 ? 1 : -1;
  const enemyGoalX = p.team === 0 ? PITCH_W : 0;

  // Goalkeeper AI
  if (p.role === 'GK') {
    if (hasBall) {
      if (p.aiCooldown <= 0) {
        triggerPass(state, p, dirSign, 0);
      }
      p.vx = 0;
      p.vy = 0;
      return;
    }

    const goalLineX = p.team === 0 ? 36 : PITCH_W - 36;
    const targetY = Math.max(GOAL_TOP + 16, Math.min(GOAL_BOTTOM - 16, b.y));
    const dx = goalLineX - p.x;
    const dy = targetY - p.y;
    const dist = Math.hypot(dx, dy);
    const spd = 255 * diff.aiSpeedMult;
    if (dist > 3) {
      p.vx = (dx / dist) * Math.min(spd, dist * 7);
      p.vy = (dy / dist) * Math.min(spd, dist * 7);
      p.diveDirY = Math.sign(p.vy);
    } else {
      p.vx = 0;
      p.vy = 0;
      p.diveDirY = 0;
    }
    p.facingX = dirSign;
    p.facingY = 0;
    return;
  }

  // Outfielder with ball
  if (hasBall) {
    const distToGoal = Math.hypot(enemyGoalX - p.x, PITCH_H / 2 - p.y);
    const gauge = p.team === 0 ? state.superGaugeHome : state.superGaugeAway;

    // Shoot if within range
    if (distToGoal < 260 && p.aiCooldown <= 0) {
      const aimOffset = (Math.random() - 0.5) * 0.9;
      const useSuper = gauge >= 100;
      triggerShot(state, p, 0.5 + Math.random() * 0.35, aimOffset, useSuper);
      p.aiCooldown = 1.3;
      return;
    }

    // Check if an opponent is pressing closely -> pass to open forward mate
    let nearestThreat = Infinity;
    for (const opp of state.players) {
      if (opp.team === p.team || opp.stunTimer > 0) continue;
      const d = Math.hypot(opp.x - p.x, opp.y - p.y);
      if (d < nearestThreat) nearestThreat = d;
    }

    if (nearestThreat < 56 && p.aiCooldown <= 0 && Math.random() < dt * 4.5) {
      triggerPass(state, p, dirSign, (PITCH_H / 2 - p.y) * 0.002);
      p.aiCooldown = 0.55;
      return;
    }

    // Dribble toward opponent goal with slight evasion
    const targetX = enemyGoalX - dirSign * 140;
    const targetY = PITCH_H / 2 + Math.sin(p.id * 1.7 + state.timeRemaining * 0.8) * 110;
    movePlayerToward(p, targetX, targetY, 192 * p.speedStat * diff.aiSpeedMult, dt);
    return;
  }

  // Outfielder without ball
  const owner = b.ownerId !== null ? state.players[b.ownerId] : null;
  const teamHasBall = owner !== null && owner.team === p.team;

  if (teamHasBall) {
    // Support positioning ahead of carrier
    const advanceX = p.role === 'FW' ? 210 : p.role === 'MF' ? 120 : 30;
    const tx = Math.max(90, Math.min(PITCH_W - 90, p.homeX + dirSign * advanceX));
    const ty = p.homeY * 0.65 + (PITCH_H - b.y) * 0.35;
    movePlayerToward(p, tx, ty, 180 * p.speedStat * diff.aiSpeedMult, dt);
    return;
  }

  // Defending / Chasing loose ball
  const nearestTeamChaser = selectNearestPlayer(state, p.team);
  const isClosestChaser = nearestTeamChaser?.id === p.id;

  if (isClosestChaser) {
    const chaseX = b.x;
    const chaseY = b.y;
    const d = Math.hypot(chaseX - p.x, chaseY - p.y);
    movePlayerToward(p, chaseX, chaseY, 195 * p.speedStat * diff.aiSpeedMult, dt);

    // Attempt tackle on opponent carrier
    if (
      owner &&
      owner.team !== p.team &&
      d < 52 &&
      p.tackleCooldown <= 0 &&
      Math.random() < dt * 2.4 * diff.tackleRate
    ) {
      triggerTackle(state, p);
    }
  } else {
    // Hold tactical shape shifted toward ball
    const shiftX = (b.x - PITCH_W / 2) * 0.42;
    const shiftY = (b.y - PITCH_H / 2) * 0.38;
    const tx = Math.max(70, Math.min(PITCH_W - 70, p.homeX + shiftX));
    const ty = Math.max(50, Math.min(PITCH_H - 50, p.homeY + shiftY));
    movePlayerToward(p, tx, ty, 168 * p.speedStat * diff.aiSpeedMult, dt);
  }
}

function movePlayerToward(
  p: PlayerEntity,
  tx: number,
  ty: number,
  speed: number,
  dt: number
): void {
  const dx = tx - p.x;
  const dy = ty - p.y;
  const dist = Math.hypot(dx, dy);
  if (dist > 6) {
    const nx = dx / dist;
    const ny = dy / dist;
    p.vx = nx * speed;
    p.vy = ny * speed;
    p.facingX = nx;
    p.facingY = ny;
  } else {
    p.vx *= Math.pow(0.05, dt);
    p.vy *= Math.pow(0.05, dt);
  }
}

function clampPlayerToPitch(p: PlayerEntity): void {
  p.x = Math.max(22, Math.min(PITCH_W - 22, p.x));
  p.y = Math.max(22, Math.min(PITCH_H - 22, p.y));
}

function resolvePlayerSeparations(state: MatchState): void {
  const minD = PLAYER_RADIUS * 1.85;
  const list = state.players;
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i];
      const b = list[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0 && dist < minD) {
        const push = (minD - dist) * 0.5;
        const nx = dx / dist;
        const ny = dy / dist;
        a.x -= nx * push;
        a.y -= ny * push;
        b.x += nx * push;
        b.y += ny * push;
      }
    }
  }
}

function checkTackleCollisions(state: MatchState, tackler: PlayerEntity): void {
  for (const target of state.players) {
    if (target.team === tackler.team || target.stunTimer > 0) continue;
    const dx = target.x - tackler.x;
    const dy = target.y - tackler.y;
    const dist = Math.hypot(dx, dy);
    if (dist < PLAYER_RADIUS * 1.95) {
      // Knock victim down!
      const nx = dist > 0.1 ? dx / dist : tackler.facingX;
      const ny = dist > 0.1 ? dy / dist : tackler.facingY;
      target.stunTimer = 1.15;
      target.vx = nx * 240;
      target.vy = ny * 240;
      target.vz = 115;
      target.z = 1;
      target.hitFlashTimer = 0.12;
      target.squashX = 1.3;
      target.squashY = 0.7;

      if (state.ball.ownerId === target.id) {
        state.ball.ownerId = tackler.id;
        state.ball.lastTouchTeam = tackler.team;
        state.ball.superType = null;
        if (tackler.team === 0 && tackler.role !== 'GK') {
          state.activeHomeId = tackler.id;
        }
        spawnPopup(state, '抢断!', tackler.x, tackler.y - 28, '#4ade80', 1.0);
      }

      if (tackler.team === 0) {
        state.stats.homeTackles += 1;
        state.superGaugeHome = Math.min(100, state.superGaugeHome + 14);
      } else {
        state.stats.awayTackles += 1;
        state.superGaugeAway = Math.min(100, state.superGaugeAway + 14);
      }

      state.hitstopTimer = 0.045;
      state.trauma = Math.min(1, state.trauma + 0.35);
      spawnBurst(state, target.x, target.y, 12, 10, '#fde047', 170, 4);
      state.events.push('stun');
    }
  }
}

function stepBallPhysics(state: MatchState, dt: number): void {
  const b = state.ball;
  if (b.pickupCooldown > 0) b.pickupCooldown = Math.max(0, b.pickupCooldown - dt);

  // Record trail ring buffer
  b.trailIndex = (b.trailIndex + 1) % TRAIL_LEN;
  b.trailX[b.trailIndex] = b.x;
  b.trailY[b.trailIndex] = b.y;
  b.trailZ[b.trailIndex] = b.z;

  if (b.ownerId !== null) {
    const owner = state.players[b.ownerId];
    if (!owner || owner.stunTimer > 0) {
      b.ownerId = null;
    } else {
      const dribbleBounce = Math.abs(Math.sin(owner.walkPhase * 1.4)) * 3;
      b.x = owner.x + owner.facingX * (PLAYER_RADIUS + 4);
      b.y = owner.y + owner.facingY * (PLAYER_RADIUS + 4);
      b.z = owner.z + dribbleBounce;
      b.vx = owner.vx;
      b.vy = owner.vy;
      b.vz = 0;
      b.superType = null;
      return;
    }
  }

  // Super shot special motion
  if (b.superType && b.superTimer > 0) {
    b.superTimer -= dt;
    if (b.superType === 'banana') {
      // Strong Magnus lateral curve
      const spd = Math.hypot(b.vx, b.vy) || 1;
      const perpX = -b.vy / spd;
      const perpY = b.vx / spd;
      b.vx += perpX * b.superCurveDir * 440 * dt;
      b.vy += perpY * b.superCurveDir * 440 * dt;
      spawnParticle(state, b.x, b.y, b.z, -b.vx * 0.1, -b.vy * 0.1, 20, '#facc15', 4, 0.22);
    } else if (b.superType === 'dragon') {
      spawnParticle(state, b.x, b.y, b.z, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60, 45, '#ef4444', 5, 0.25);
    } else if (b.superType === 'thunder') {
      spawnParticle(state, b.x, b.y, b.z, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80, 30, '#60a5fa', 4, 0.18);
    } else if (b.superType === 'phantom') {
      // Z-wave zig-zag warp
      const spd = Math.hypot(b.vx, b.vy) || 1;
      const perpX = -b.vy / spd;
      const perpY = b.vx / spd;
      const wave = Math.sin(b.superTimer * 24) * 520;
      b.vx += perpX * wave * dt;
      b.vy += perpY * wave * dt;
      spawnParticle(state, b.x, b.y, b.z, 0, 0, 15, '#22d3ee', 5, 0.2);
    }

    // Super shot knocks away non-GK defenders in its path
    for (const p of state.players) {
      if (p.role === 'GK' || p.team === b.lastTouchTeam || p.stunTimer > 0) continue;
      if (Math.hypot(p.x - b.x, p.y - b.y) < PLAYER_RADIUS + BALL_RADIUS + 6 && b.z < 36) {
        p.stunTimer = 0.9;
        p.vx = b.vx * 0.25;
        p.vy = b.vy * 0.25;
        p.vz = 140;
        p.z = 2;
        p.hitFlashTimer = 0.1;
        state.events.push('stun');
      }
    }

    if (b.superTimer <= 0) b.superType = null;
  }

  // Apply velocity & gravity
  b.x += b.vx * dt;
  b.y += b.vy * dt;
  b.z += b.vz * dt;
  b.spin += Math.hypot(b.vx, b.vy) * dt * 0.05;

  if (b.z > 0) {
    b.vz -= GRAVITY * dt;
    if (b.z <= 0) {
      b.z = 0;
      if (Math.abs(b.vz) > 45) {
        b.vz = -b.vz * 0.58;
        state.events.push('bounce');
      } else {
        b.vz = 0;
      }
    }
  } else {
    // Ground turf friction (less friction during active super shot)
    const friction = b.superType ? 0.55 : 0.14;
    b.vx *= Math.pow(friction, dt);
    b.vy *= Math.pow(friction, dt);
  }

  // Top & bottom touchline cushions (fast arcade arena walls!)
  if (b.y < BALL_RADIUS) {
    b.y = BALL_RADIUS;
    b.vy = Math.abs(b.vy) * 0.78;
    state.events.push('bounce');
  } else if (b.y > PITCH_H - BALL_RADIUS) {
    b.y = PITCH_H - BALL_RADIUS;
    b.vy = -Math.abs(b.vy) * 0.78;
    state.events.push('bounce');
  }

  // Goalposts & Endline walls (unless inside goal mouth)
  const inGoalMouthY = b.y > GOAL_TOP + BALL_RADIUS && b.y < GOAL_BOTTOM - BALL_RADIUS && b.z < GOAL_CROSSBAR_Z;

  // Check goalpost circular hits at (0, GOAL_TOP), (0, GOAL_BOTTOM), (PITCH_W, GOAL_TOP), (PITCH_W, GOAL_BOTTOM)
  const posts: Array<[number, number]> = [
    [0, GOAL_TOP],
    [0, GOAL_BOTTOM],
    [PITCH_W, GOAL_TOP],
    [PITCH_W, GOAL_BOTTOM],
  ];
  for (const [px, py] of posts) {
    const dx = b.x - px;
    const dy = b.y - py;
    const dist = Math.hypot(dx, dy);
    if (dist > 0 && dist < BALL_RADIUS + 6 && b.z < GOAL_CROSSBAR_Z + 6) {
      const nx = dx / dist;
      const ny = dy / dist;
      b.x = px + nx * (BALL_RADIUS + 6);
      b.y = py + ny * (BALL_RADIUS + 6);
      const dot = b.vx * nx + b.vy * ny;
      if (dot < 0) {
        b.vx -= 1.8 * dot * nx;
        b.vy -= 1.8 * dot * ny;
        state.trauma = Math.min(1, state.trauma + 0.35);
        spawnPopup(state, '门柱!', px, py - 18, '#f8fafc', 1.0);
        state.events.push('post_clang');
      }
    }
  }

  // Left & right endlines outside goal mouth bounce back into play
  if (!inGoalMouthY) {
    if (b.x < BALL_RADIUS) {
      b.x = BALL_RADIUS;
      b.vx = Math.abs(b.vx) * 0.78;
      state.events.push('bounce');
    } else if (b.x > PITCH_W - BALL_RADIUS) {
      b.x = PITCH_W - BALL_RADIUS;
      b.vx = -Math.abs(b.vx) * 0.78;
      state.events.push('bounce');
    }
  } else {
    // Inside goal net depth bounds during goal celebration
    if (b.x < -GOAL_DEPTH + BALL_RADIUS) {
      b.x = -GOAL_DEPTH + BALL_RADIUS;
      b.vx = Math.abs(b.vx) * 0.25;
      b.vy *= 0.4;
      state.netRippleLeft = 1.0;
    } else if (b.x > PITCH_W + GOAL_DEPTH - BALL_RADIUS) {
      b.x = PITCH_W + GOAL_DEPTH - BALL_RADIUS;
      b.vx = -Math.abs(b.vx) * 0.25;
      b.vy *= 0.4;
      state.netRippleRight = 1.0;
    }
    if (b.y < GOAL_TOP + BALL_RADIUS) {
      b.y = GOAL_TOP + BALL_RADIUS;
      b.vy = Math.abs(b.vy) * 0.4;
    } else if (b.y > GOAL_BOTTOM - BALL_RADIUS) {
      b.y = GOAL_BOTTOM - BALL_RADIUS;
      b.vy = -Math.abs(b.vy) * 0.4;
    }
  }
}

function checkBallOwnershipAndSaves(
  state: MatchState,
  diff: ReturnType<typeof getDifficultyParams>
): void {
  const b = state.ball;
  if (b.ownerId !== null || b.pickupCooldown > 0) return;

  const ballSpeed = Math.hypot(b.vx, b.vy);

  for (const p of state.players) {
    if (p.stunTimer > 0) continue;
    const dist = Math.hypot(b.x - p.x, b.y - p.y);

    // Goalkeeper save check
    if (p.role === 'GK' && dist < diff.gkSaveRadius && b.z < GOAL_CROSSBAR_Z) {
      if (b.superType && b.lastTouchTeam !== p.team && ballSpeed > 650 && Math.random() < 0.42) {
        // Super shot blasts GK backward and knocks ball slightly slower!
        p.stunTimer = 0.75;
        p.vx = b.vx * 0.22;
        p.hitFlashTimer = 0.12;
        b.vx *= 0.78;
        b.pickupCooldown = 0.2;
        spawnPopup(state, '门将震飞!', p.x, p.y - 28, '#f87171', 1.0);
        state.events.push('stun');
        return;
      }

      // GK catches/deflects!
      b.ownerId = p.id;
      b.lastTouchTeam = p.team;
      b.superType = null;
      b.vx = 0;
      b.vy = 0;
      b.vz = 0;
      p.aiCooldown = 0.42;
      p.squashX = 1.25;
      p.squashY = 0.78;
      if (ballSpeed > 380) {
        spawnPopup(state, '神扑!', p.x, p.y - 28, '#38bdf8', 1.0);
      }
      state.events.push('save');
      return;
    }

    // Outfielder pickup check
    if (p.role !== 'GK' && dist < PLAYER_RADIUS + BALL_RADIUS + 4 && b.z < 28) {
      // Cannot instantly pick up active enemy super shot unless slow
      if (b.superType && b.lastTouchTeam !== p.team && ballSpeed > 450) {
        continue;
      }
      b.ownerId = p.id;
      b.lastTouchTeam = p.team;
      b.superType = null;
      if (p.team === 0) state.activeHomeId = p.id;
      return;
    }
  }
}

function checkGoalScored(state: MatchState): void {
  if (state.phase !== 'live') return;
  const b = state.ball;
  const inMouthY = b.y > GOAL_TOP && b.y < GOAL_BOTTOM && b.z < GOAL_CROSSBAR_Z;
  if (!inMouthY) return;

  if (b.x > PITCH_W + BALL_RADIUS * 0.5) {
    // Home scored!
    state.scoreHome += 1;
    state.lastScorerTeam = 0;
    state.phase = 'goal';
    state.phaseTimer = state.config.attractMode ? 1.2 : 1.9;
    state.netRippleRight = 1.0;
    state.trauma = 0.85;
    state.hitstopTimer = 0.06;
    state.superGaugeAway = Math.min(100, state.superGaugeAway + 25);
    spawnBurst(state, PITCH_W, b.y, 20, 28, '#facc15', 260, 5);
    spawnPopup(state, 'GOAL!!', PITCH_W - 80, b.y - 30, '#fde047', 1.6);
    state.events.push('goal');
  } else if (b.x < -BALL_RADIUS * 0.5) {
    // Away scored!
    state.scoreAway += 1;
    state.lastScorerTeam = 1;
    state.phase = 'goal';
    state.phaseTimer = state.config.attractMode ? 1.2 : 1.9;
    state.netRippleLeft = 1.0;
    state.trauma = 0.85;
    state.hitstopTimer = 0.06;
    state.superGaugeHome = Math.min(100, state.superGaugeHome + 25);
    spawnBurst(state, 0, b.y, 20, 28, '#f87171', 260, 5);
    spawnPopup(state, 'GOAL!!', 80, b.y - 30, '#f87171', 1.6);
    state.events.push('goal');
  }
}

function updateParticlesAndPopups(state: MatchState, dt: number): void {
  for (let i = 0; i < state.particles.length; i++) {
    const pt = state.particles[i];
    if (!pt.active) continue;
    pt.life -= dt;
    if (pt.life <= 0) {
      pt.active = false;
      continue;
    }
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.z = Math.max(0, pt.z + pt.vz * dt);
    pt.vz -= GRAVITY * 0.45 * dt;
  }

  for (let i = 0; i < state.popups.length; i++) {
    const pop = state.popups[i];
    if (!pop.active) continue;
    pop.life -= dt;
    if (pop.life <= 0) {
      pop.active = false;
      continue;
    }
    pop.y += pop.vy * dt;
  }
}

function updateCamera(state: MatchState, dt: number): void {
  const b = state.ball;
  const targetX = PITCH_W / 2 + (b.x - PITCH_W / 2) * 0.35;
  const targetY = PITCH_H / 2 + (b.y - PITCH_H / 2) * 0.25;
  const alpha = Math.min(1, dt * 7);
  state.cameraX += (targetX - state.cameraX) * alpha;
  state.cameraY += (targetY - state.cameraY) * alpha;
}

export function extractHudSnapshot(state: MatchState): HudSnapshot {
  const owner = state.ball.ownerId !== null ? state.players[state.ball.ownerId] : null;
  return {
    scoreHome: state.scoreHome,
    scoreAway: state.scoreAway,
    timeRemaining: Math.ceil(state.timeRemaining),
    phase: state.phase,
    superGaugeHome: Math.round(state.superGaugeHome),
    superGaugeAway: Math.round(state.superGaugeAway),
    lastScorerTeam: state.lastScorerTeam,
    hasBallHome: owner?.team === 0,
    stats: { ...state.stats },
  };
}
