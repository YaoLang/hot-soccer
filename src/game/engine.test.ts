import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GOAL_BOTTOM,
  GOAL_TOP,
  PITCH_H,
  PITCH_W,
  createMatchState,
  stepMatch,
  triggerPass,
  triggerShot,
  triggerTackle,
} from './engine';
import { InputState } from './types';
import { buildStandaloneSingleHtml } from '../utils/singleHtmlExporter';

function emptyInput(): InputState {
  return {
    moveX: 0,
    moveY: 0,
    dashHeld: false,
    passJustPressed: false,
    shootHeld: false,
    shootJustPressed: false,
    shootJustReleased: false,
    jumpSuperJustPressed: false,
  };
}

test('match initializes in kickoff phase with 8 players (4v4) and transitions to live', () => {
  const state = createMatchState({
    homeTeamId: 'nekketsu',
    awayTeamId: 'samba',
    durationSec: 90,
    difficulty: 'hotblood',
  });

  assert.equal(state.players.length, 8);
  assert.equal(state.phase, 'kickoff');
  assert.equal(state.scoreHome, 0);
  assert.equal(state.scoreAway, 0);

  // Advance 1.1s in clamped steps -> kickoff ends
  for (let i = 0; i < 30; i++) {
    stepMatch(state, emptyInput(), 0.04);
  }
  assert.equal(state.phase, 'live');
});

test('survives initial seconds with zero user input without errors or NaN', () => {
  const state = createMatchState({
    homeTeamId: 'nekketsu',
    awayTeamId: 'panzer',
    durationSec: 90,
    difficulty: 'hotblood',
  });

  for (let i = 0; i < 120; i++) {
    stepMatch(state, emptyInput(), 0.033);
  }

  assert.ok(Number.isFinite(state.ball.x));
  assert.ok(Number.isFinite(state.ball.y));
  assert.ok(state.timeRemaining < 90);
});

test('human movement input moves the active home player accurately', () => {
  const state = createMatchState({
    homeTeamId: 'nekketsu',
    awayTeamId: 'samba',
    durationSec: 90,
    difficulty: 'hotblood',
  });
  state.phase = 'live';

  const active = state.players.find((p) => p.id === state.activeHomeId)!;
  const startX = active.x;
  const input = emptyInput();
  input.moveX = 1;

  for (let i = 0; i < 10; i++) {
    stepMatch(state, input, 0.03);
  }
  assert.ok(active.x > startX + 30);
});

test('goal detection increments home score when ball crosses right goal mouth', () => {
  const state = createMatchState({
    homeTeamId: 'nekketsu',
    awayTeamId: 'samba',
    durationSec: 90,
    difficulty: 'hotblood',
  });
  state.phase = 'live';
  // Move away GK out of the way
  const awayGk = state.players.find((p) => p.team === 1 && p.role === 'GK')!;
  awayGk.y = 50;

  state.ball.ownerId = null;
  state.ball.x = PITCH_W - 6;
  state.ball.y = (GOAL_TOP + GOAL_BOTTOM) / 2;
  state.ball.z = 12;
  state.ball.vx = 520;
  state.ball.vy = 0;

  for (let i = 0; i < 5; i++) {
    stepMatch(state, emptyInput(), 0.03);
  }

  assert.equal(state.scoreHome, 1);
  assert.equal(state.phase, 'goal');
  assert.equal(state.lastScorerTeam, 0);
});

test('super shot consumes full gauge, triggers hitstop, and activates ball superType', () => {
  const state = createMatchState({
    homeTeamId: 'panzer',
    awayTeamId: 'ninja',
    durationSec: 90,
    difficulty: 'hotblood',
  });
  state.phase = 'live';
  state.superGaugeHome = 100;

  const shooter = state.players.find((p) => p.id === state.activeHomeId)!;
  state.ball.ownerId = shooter.id;

  triggerShot(state, shooter, 0.9, 0, true);

  assert.equal(state.superGaugeHome, 0);
  assert.equal(state.ball.superType, 'thunder');
  assert.ok(state.hitstopTimer > 0);
  assert.equal(state.stats.homeSuperShots, 1);
  assert.ok(state.ball.vx > 700);
});

test('sliding tackle steals ball from opponent carrier and stuns them', () => {
  const state = createMatchState({
    homeTeamId: 'nekketsu',
    awayTeamId: 'samba',
    durationSec: 90,
    difficulty: 'hotblood',
  });
  state.phase = 'live';

  const home = state.players.find((p) => p.id === state.activeHomeId)!;
  const away = state.players.find((p) => p.team === 1 && p.role === 'FW')!;
  home.x = 500;
  home.y = 300;
  home.facingX = 1;
  home.facingY = 0;

  away.x = 518;
  away.y = 300;
  state.ball.ownerId = away.id;

  triggerTackle(state, home);
  stepMatch(state, emptyInput(), 0.02);

  assert.ok(away.stunTimer > 0.5);
  assert.equal(state.ball.ownerId, home.id);
  assert.equal(state.stats.homeTackles, 1);
});

test('pass switches active control to receiving teammate', () => {
  const state = createMatchState({
    homeTeamId: 'nekketsu',
    awayTeamId: 'samba',
    durationSec: 90,
    difficulty: 'hotblood',
  });
  state.phase = 'live';

  const passer = state.players.find((p) => p.team === 0 && p.role === 'MF')!;
  const receiver = state.players.find((p) => p.team === 0 && p.role === 'FW')!;
  passer.x = 300;
  passer.y = 300;
  receiver.x = 500;
  receiver.y = 300;
  state.activeHomeId = passer.id;
  state.ball.ownerId = passer.id;
  state.ball.x = passer.x + 18;
  state.ball.y = passer.y;

  triggerPass(state, passer, 1, 0);

  assert.equal(state.ball.ownerId, null);
  assert.equal(state.activeHomeId, receiver.id);
  assert.ok(state.ball.vx > 300);
});

test('match transitions to fulltime when timeRemaining reaches 0', () => {
  const state = createMatchState({
    homeTeamId: 'nekketsu',
    awayTeamId: 'samba',
    durationSec: 1,
    difficulty: 'hotblood',
  });
  state.phase = 'live';
  state.timeRemaining = 0.05;

  stepMatch(state, emptyInput(), 0.05);
  stepMatch(state, emptyInput(), 0.02);

  assert.equal(state.phase, 'fulltime');
  assert.equal(state.timeRemaining, 0);
});

test('ball bounces cleanly off top and bottom touchline cushions without exiting pitch', () => {
  const state = createMatchState({
    homeTeamId: 'nekketsu',
    awayTeamId: 'samba',
    durationSec: 90,
    difficulty: 'hotblood',
  });
  state.phase = 'live';
  state.ball.ownerId = null;
  state.ball.x = PITCH_W / 2;
  state.ball.y = 3;
  state.ball.vy = -300;

  stepMatch(state, emptyInput(), 0.03);
  assert.ok(state.ball.y >= 10);
  assert.ok(state.ball.vy > 0);

  state.ball.y = PITCH_H - 3;
  state.ball.vy = 300;
  stepMatch(state, emptyInput(), 0.03);
  assert.ok(state.ball.y <= PITCH_H - 10);
  assert.ok(state.ball.vy < 0);
});

test('standalone single HTML exporter produces self-contained landscape-ready HTML', () => {
  const html = buildStandaloneSingleHtml();
  assert.ok(html.startsWith('<!doctype html>'));
  assert.ok(html.includes('rot90'));
  assert.ok(html.includes('screen-orientation'));
  assert.ok(!html.includes('<script src='));
  assert.ok(html.includes('热血高校'));
});
