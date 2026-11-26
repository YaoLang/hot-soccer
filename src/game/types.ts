export type GameModeState = 'title' | 'playing' | 'paused' | 'gameover';

export type Difficulty = 'rookie' | 'hotblood' | 'legend';

export type SuperShotType = 'dragon' | 'banana' | 'thunder' | 'phantom';

export type PlayerRole = 'GK' | 'DF' | 'MF' | 'FW';

export interface TeamConfig {
  id: string;
  name: string;
  shortName: string;
  captainName: string;
  superName: string;
  superDesc: string;
  superType: SuperShotType;
  primaryColor: string;
  secondaryColor: string;
  hairColor: string;
  skinColor: string;
  speedRating: number;
  powerRating: number;
  techniqueRating: number;
}

export const TEAMS: TeamConfig[] = [
  {
    id: 'nekketsu',
    name: '热血高校',
    shortName: '热血',
    captainName: '国夫',
    superName: '爆炎龙卷射',
    superDesc: '直线炽焰贯通，击飞沿途防守',
    superType: 'dragon',
    primaryColor: '#dc2626',
    secondaryColor: '#f8fafc',
    hairColor: '#1e1b18',
    skinColor: '#f6c39b',
    speedRating: 88,
    powerRating: 92,
    techniqueRating: 82,
  },
  {
    id: 'samba',
    name: '桑巴风暴',
    shortName: '桑巴',
    captainName: '卡洛斯',
    superName: '香蕉旋风球',
    superDesc: '大弧线诡异弯折，绕过门将十指关',
    superType: 'banana',
    primaryColor: '#eab308',
    secondaryColor: '#15803d',
    hairColor: '#171717',
    skinColor: '#c9885b',
    speedRating: 94,
    powerRating: 82,
    techniqueRating: 95,
  },
  {
    id: 'panzer',
    name: '铁甲战车',
    shortName: '铁甲',
    captainName: '施耐德',
    superName: '雷霆陨石炮',
    superDesc: '极速重炮轰门，震飞门将扑救',
    superType: 'thunder',
    primaryColor: '#1d4ed8',
    secondaryColor: '#e2e8f0',
    hairColor: '#e5b84b',
    skinColor: '#f7d1b2',
    speedRating: 80,
    powerRating: 98,
    techniqueRating: 84,
  },
  {
    id: 'ninja',
    name: '疾风忍者',
    shortName: '忍者',
    captainName: '服部',
    superName: '幻影折跃踢',
    superDesc: '空中Z字折跃闪现，防不胜防',
    superType: 'phantom',
    primaryColor: '#6d28d9',
    secondaryColor: '#22d3ee',
    hairColor: '#1e293b',
    skinColor: '#f3bfa0',
    speedRating: 96,
    powerRating: 80,
    techniqueRating: 92,
  },
];

export interface PlayerEntity {
  id: number;
  team: 0 | 1; // 0 = Home (Left -> Right), 1 = Away (Right -> Left)
  role: PlayerRole;
  number: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  homeX: number;
  homeY: number;
  facingX: number;
  facingY: number;
  walkPhase: number;
  stamina: number;
  speedStat: number;
  powerStat: number;
  // Action timers (in seconds)
  stunTimer: number;
  tackleTimer: number;
  tackleCooldown: number;
  kickAnimTimer: number;
  hitFlashTimer: number;
  squashX: number;
  squashY: number;
  diveDirY: number; // for GK dive visual
  aiCooldown: number;
  isCaptain: boolean;
}

export interface BallEntity {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  ownerId: number | null;
  lastTouchTeam: 0 | 1 | null;
  pickupCooldown: number;
  spin: number;
  superType: SuperShotType | null;
  superTimer: number;
  superCurveDir: number;
  trailIndex: number;
  trailX: Float32Array;
  trailY: Float32Array;
  trailZ: Float32Array;
}

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export interface FloatingPopup {
  active: boolean;
  text: string;
  x: number;
  y: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  scale: number;
}

export interface MatchStats {
  homeShots: number;
  awayShots: number;
  homeSuperShots: number;
  awaySuperShots: number;
  homeTackles: number;
  awayTackles: number;
}

export interface MatchConfig {
  homeTeamId: string;
  awayTeamId: string;
  durationSec: number;
  difficulty: Difficulty;
  attractMode?: boolean;
}

export type MatchPhase = 'kickoff' | 'live' | 'goal' | 'fulltime';

export interface MatchState {
  config: MatchConfig;
  phase: MatchPhase;
  phaseTimer: number;
  timeRemaining: number;
  scoreHome: number;
  scoreAway: number;
  lastScorerTeam: 0 | 1 | null;
  superGaugeHome: number; // 0..100
  superGaugeAway: number; // 0..100
  activeHomeId: number;
  shotCharge: number; // 0..1 while holding shoot
  isChargingShot: boolean;
  hitstopTimer: number;
  cameraX: number;
  cameraY: number;
  trauma: number; // 0..1 screen shake trauma
  netRippleLeft: number;
  netRippleRight: number;
  players: PlayerEntity[];
  ball: BallEntity;
  particles: Particle[];
  particleCursor: number;
  popups: FloatingPopup[];
  popupCursor: number;
  stats: MatchStats;
  events: MatchEvent[];
}

export type MatchEvent =
  | 'kick'
  | 'pass'
  | 'super_shot'
  | 'tackle'
  | 'stun'
  | 'bounce'
  | 'post_clang'
  | 'goal'
  | 'whistle'
  | 'save';

export interface InputState {
  moveX: number; // -1..1
  moveY: number; // -1..1
  dashHeld: boolean;
  passJustPressed: boolean;
  shootHeld: boolean;
  shootJustPressed: boolean;
  shootJustReleased: boolean;
  jumpSuperJustPressed: boolean;
}

export interface HudSnapshot {
  scoreHome: number;
  scoreAway: number;
  timeRemaining: number;
  phase: MatchPhase;
  superGaugeHome: number;
  superGaugeAway: number;
  lastScorerTeam: 0 | 1 | null;
  hasBallHome: boolean;
  stats: MatchStats;
}
