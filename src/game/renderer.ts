import {
  BALL_RADIUS,
  GOAL_BOTTOM,
  GOAL_CROSSBAR_Z,
  GOAL_DEPTH,
  GOAL_TOP,
  PITCH_H,
  PITCH_W,
  PLAYER_RADIUS,
  getTeamConfig,
} from './engine';
import { MatchState, PlayerEntity, TeamConfig } from './types';

let cachedPitchCanvas: HTMLCanvasElement | null = null;
let cachedPitchKey = '';

function ensurePitchCache(homeTeam: TeamConfig, awayTeam: TeamConfig): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const key = `${homeTeam.id}:${awayTeam.id}`;
  if (cachedPitchCanvas && cachedPitchKey === key) return cachedPitchCanvas;

  const padL = 70;
  const padT = 80;
  const totalW = PITCH_W + padL * 2;
  const totalH = PITCH_H + padT + 44;

  const off = cachedPitchCanvas ?? document.createElement('canvas');
  off.width = totalW;
  off.height = totalH;
  const octx = off.getContext('2d');
  if (!octx) return null;

  octx.save();
  octx.translate(padL, padT);

  // Running track apron around pitch
  octx.fillStyle = '#3b2422';
  octx.fillRect(-padL, -52, totalW, PITCH_H + 96);

  // Inner apron border
  octx.fillStyle = '#174d2b';
  octx.fillRect(-20, -16, PITCH_W + 40, PITCH_H + 32);

  // Top stand base
  octx.fillStyle = '#1a2332';
  octx.fillRect(-padL, -padT, totalW, 44);

  // Ad boards along top touchline
  const boards = [
    { label: homeTeam.name, bg: homeTeam.primaryColor, fg: '#ffffff' },
    { label: '热血杯 · NEKKETSU', bg: '#0f172a', fg: '#facc15' },
    { label: '必杀绝技', bg: '#b91c1c', fg: '#ffffff' },
    { label: awayTeam.name, bg: awayTeam.primaryColor, fg: '#ffffff' },
  ];
  const segW = PITCH_W / boards.length;
  octx.font = '700 11px "Chakra Petch", "Noto Sans SC", sans-serif';
  octx.textAlign = 'center';
  octx.textBaseline = 'middle';
  for (let i = 0; i < boards.length; i++) {
    const bx = i * segW;
    octx.fillStyle = boards[i].bg;
    octx.fillRect(bx + 2, -32, segW - 4, 16);
    octx.strokeStyle = '#090d14';
    octx.lineWidth = 2;
    octx.strokeRect(bx + 2, -32, segW - 4, 16);
    octx.fillStyle = boards[i].fg;
    octx.fillText(boards[i].label, bx + segW / 2, -23.5);
  }

  drawPitchTurf(octx);
  octx.restore();

  cachedPitchCanvas = off;
  cachedPitchKey = key;
  return off;
}

export function renderMatch(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: MatchState,
  nowSec: number
): void {
  ctx.save();
  // Full-bleed stadium apron background (seamless across ultra-wide and mobile screens)
  ctx.fillStyle = '#2d1c1b';
  ctx.fillRect(0, 0, width, height);

  // Top dark bleacher band
  ctx.fillStyle = '#131b26';
  ctx.fillRect(0, 0, width, height * 0.14);

  const worldPadX = 112;
  const worldPadY = 92;
  const totalW = PITCH_W + worldPadX;
  const totalH = PITCH_H + worldPadY;

  const scale = Math.min(width / totalW, height / totalH);

  // Camera shake (trauma^2)
  const shakeMag = state.trauma * state.trauma * 14;
  const shakeX = shakeMag > 0.1 ? (Math.random() - 0.5) * 2 * shakeMag : 0;
  const shakeY = shakeMag > 0.1 ? (Math.random() - 0.5) * 2 * shakeMag : 0;

  // Subtle camera follow bias while keeping entire pitch visible
  const camOffsetX = (PITCH_W / 2 - state.cameraX) * 0.09;
  const camOffsetY = (PITCH_H / 2 - state.cameraY) * 0.06;

  const originX = width / 2 - (PITCH_W * scale) / 2 + (camOffsetX + shakeX) * scale;
  const originY = height / 2 - (PITCH_H * scale) / 2 + (camOffsetY + shakeY) * scale + 10 * scale;

  ctx.translate(originX, originY);
  ctx.scale(scale, scale);

  const homeTeam = getTeamConfig(state.config.homeTeamId);
  const awayTeam = getTeamConfig(state.config.awayTeamId);

  const cached = ensurePitchCache(homeTeam, awayTeam);
  if (cached) {
    ctx.drawImage(cached, -70, -80);
  } else {
    drawPitchTurf(ctx);
  }

  drawCheeringSpectators(ctx, state, homeTeam, awayTeam, nowSec);
  drawGoalBackNet(ctx, 'left', state.netRippleLeft);
  drawGoalBackNet(ctx, 'right', state.netRippleRight);

  // Depth-sort players and ball by ground Y
  const sortedPlayers = [...state.players].sort((a, b) => a.y - b.y);
  let ballDrawn = false;

  for (const p of sortedPlayers) {
    if (!ballDrawn && state.ball.y < p.y) {
      drawBall(ctx, state, nowSec);
      ballDrawn = true;
    }
    drawPlayer(ctx, p, p.team === 0 ? homeTeam : awayTeam, state, nowSec);
  }
  if (!ballDrawn) {
    drawBall(ctx, state, nowSec);
  }

  // Draw front goal frames & crossbars over players inside the net
  drawGoalFrame(ctx, 'left', state.netRippleLeft);
  drawGoalFrame(ctx, 'right', state.netRippleRight);

  // Particles
  drawParticles(ctx, state);

  // Floating arcade popups
  drawPopups(ctx, state);

  // Kickoff banner on canvas
  if (state.phase === 'kickoff' && !state.config.attractMode) {
    drawCenterBanner(ctx, 'KICK OFF!', '#fde047');
  } else if (state.phase === 'goal' && !state.config.attractMode) {
    const scorerName = state.lastScorerTeam === 0 ? homeTeam.name : awayTeam.name;
    const scorerColor = state.lastScorerTeam === 0 ? homeTeam.primaryColor : awayTeam.primaryColor;
    drawCenterBanner(ctx, `GOAL! ${scorerName}`, scorerColor);
  }

  ctx.restore();
}

function drawCheeringSpectators(
  ctx: CanvasRenderingContext2D,
  state: MatchState,
  homeTeam: TeamConfig,
  awayTeam: TeamConfig,
  nowSec: number
): void {
  const isGoal = state.phase === 'goal';
  const jumpAmp = isGoal ? 5.5 : 1.2;
  const speed = isGoal ? 16 : 4;
  for (let x = -40; x <= PITCH_W + 40; x += 26) {
    const bob = Math.abs(Math.sin(nowSec * speed + x * 0.17)) * jumpAmp;
    const isHomeSide = x < PITCH_W / 2;
    const shirt = isHomeSide ? homeTeam.primaryColor : awayTeam.primaryColor;
    const alt = Math.floor(x / 26) % 3 === 0 ? '#e2e8f0' : shirt;
    ctx.fillStyle = alt;
    ctx.fillRect(x - 5, -52 - bob, 10, 9);
    ctx.fillStyle = '#f3c6a5';
    ctx.fillRect(x - 4, -59 - bob, 8, 7);
  }
}

function drawPitchTurf(ctx: CanvasRenderingContext2D): void {
  const stripeCount = 10;
  const stripeW = PITCH_W / stripeCount;
  for (let i = 0; i < stripeCount; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#1f7440' : '#258449';
    ctx.fillRect(i * stripeW, 0, stripeW + 0.5, PITCH_H);
  }

  // Crisp chalk lines
  ctx.strokeStyle = 'rgba(248, 250, 252, 0.9)';
  ctx.lineWidth = 3;

  // Outer boundary
  ctx.strokeRect(0, 0, PITCH_W, PITCH_H);

  // Halfway line & center circle
  ctx.beginPath();
  ctx.moveTo(PITCH_W / 2, 0);
  ctx.lineTo(PITCH_W / 2, PITCH_H);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(PITCH_W / 2, PITCH_H / 2, 74, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(PITCH_W / 2, PITCH_H / 2, 5, 0, Math.PI * 2);
  ctx.fill();

  // Left & Right penalty boxes
  const boxW = 148;
  const boxH = 290;
  const smallW = 54;
  const smallH = 186;
  ctx.strokeRect(0, PITCH_H / 2 - boxH / 2, boxW, boxH);
  ctx.strokeRect(0, PITCH_H / 2 - smallH / 2, smallW, smallH);
  ctx.strokeRect(PITCH_W - boxW, PITCH_H / 2 - boxH / 2, boxW, boxH);
  ctx.strokeRect(PITCH_W - smallW, PITCH_H / 2 - smallH / 2, smallW, smallH);

  // Penalty arcs
  ctx.beginPath();
  ctx.arc(105, PITCH_H / 2, 56, -0.68, 0.68);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(PITCH_W - 105, PITCH_H / 2, 56, Math.PI - 0.68, Math.PI + 0.68);
  ctx.stroke();

  // Corner arcs
  const cr = 18;
  ctx.beginPath();
  ctx.arc(0, 0, cr, 0, Math.PI / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(PITCH_W, 0, cr, Math.PI / 2, Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(PITCH_W, PITCH_H, cr, Math.PI, Math.PI * 1.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, PITCH_H, cr, Math.PI * 1.5, Math.PI * 2);
  ctx.stroke();
}

function drawGoalBackNet(ctx: CanvasRenderingContext2D, side: 'left' | 'right', ripple: number): void {
  const isLeft = side === 'left';
  const gx = isLeft ? -GOAL_DEPTH : PITCH_W;
  const wobble = ripple * 6 * Math.sin(ripple * 22);

  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.36)';
  ctx.fillRect(gx + (isLeft ? wobble : 0), GOAL_TOP, GOAL_DEPTH, GOAL_BOTTOM - GOAL_TOP);

  // Net grid lines
  ctx.strokeStyle = 'rgba(241, 245, 249, 0.45)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let x = gx; x <= gx + GOAL_DEPTH; x += 10) {
    ctx.moveTo(x + wobble * 0.5, GOAL_TOP);
    ctx.lineTo(x + wobble * 0.5, GOAL_BOTTOM);
  }
  for (let y = GOAL_TOP; y <= GOAL_BOTTOM; y += 12) {
    ctx.moveTo(gx, y);
    ctx.lineTo(gx + GOAL_DEPTH, y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawGoalFrame(ctx: CanvasRenderingContext2D, side: 'left' | 'right', ripple: number): void {
  const isLeft = side === 'left';
  const lineX = isLeft ? 0 : PITCH_W;
  const backX = isLeft ? -GOAL_DEPTH : PITCH_W + GOAL_DEPTH;
  const wobble = ripple * 5;
  const barLift = GOAL_CROSSBAR_Z * 0.42;

  ctx.save();
  // Top roof net suggestion
  ctx.strokeStyle = 'rgba(248, 250, 252, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(lineX, GOAL_TOP - barLift);
  ctx.lineTo(backX + (isLeft ? -wobble : wobble), GOAL_TOP - barLift * 0.55);
  ctx.moveTo(lineX, GOAL_BOTTOM - barLift);
  ctx.lineTo(backX + (isLeft ? -wobble : wobble), GOAL_BOTTOM - barLift * 0.55);
  ctx.stroke();

  // Thick white posts and crossbar
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(lineX, GOAL_TOP);
  ctx.lineTo(lineX, GOAL_TOP - barLift);
  ctx.lineTo(lineX, GOAL_BOTTOM - barLift);
  ctx.lineTo(lineX, GOAL_BOTTOM);
  ctx.stroke();

  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(lineX, GOAL_TOP);
  ctx.lineTo(lineX, GOAL_TOP - barLift);
  ctx.lineTo(lineX, GOAL_BOTTOM - barLift);
  ctx.lineTo(lineX, GOAL_BOTTOM);
  ctx.stroke();

  // Post base caps
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(lineX, GOAL_TOP, 5, 0, Math.PI * 2);
  ctx.arc(lineX, GOAL_BOTTOM, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  p: PlayerEntity,
  team: TeamConfig,
  state: MatchState,
  nowSec: number
): void {
  const isActive = !state.config.attractMode && p.id === state.activeHomeId;
  const screenY = p.y - p.z * 0.72;

  ctx.save();

  // Ground shadow
  const shadowScale = Math.max(0.55, 1 - p.z / 120);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 8, 13 * shadowScale, 6 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Active player ring & shot charge arc
  if (isActive) {
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 8, 18, 8.5, 0, 0, Math.PI * 2);
    ctx.stroke();

    if (state.isChargingShot && state.shotCharge > 0.05) {
      ctx.strokeStyle = state.superGaugeHome >= 100 && state.shotCharge >= 0.6 ? '#ef4444' : '#38bdf8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(p.x, p.y + 8, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * state.shotCharge);
      ctx.stroke();
    }
  }

  ctx.translate(p.x, screenY);
  ctx.scale(p.squashX, p.squashY);

  // Tackle tilt
  if (p.tackleTimer > 0) {
    ctx.rotate(p.facingX >= 0 ? -0.45 : 0.45);
  } else if (p.stunTimer > 0) {
    ctx.rotate(Math.sin(nowSec * 18) * 0.22);
  }

  const facingRight = p.facingX >= 0;
  const stride = Math.sin(p.walkPhase) * (Math.hypot(p.vx, p.vy) > 15 ? 5 : 0);
  const flash = p.hitFlashTimer > 0;

  // Outline & Legs
  ctx.fillStyle = flash ? '#ffffff' : '#1e293b';
  // Left leg
  ctx.fillRect(-7 + stride * 0.5, 2, 5, 8);
  // Right leg
  ctx.fillRect(2 - stride * 0.5, 2, 5, 8);
  // Cleats
  ctx.fillStyle = flash ? '#ffffff' : '#0f172a';
  ctx.fillRect(-8 + stride * 0.5, 8, 6, 3);
  ctx.fillRect(2 - stride * 0.5, 8, 6, 3);

  // Jersey Torso (GK wears bright contrast vest)
  const jerseyColor = flash
    ? '#ffffff'
    : p.role === 'GK'
    ? p.team === 0
      ? '#10b981'
      : '#f97316'
    : team.primaryColor;

  ctx.fillStyle = '#090d14';
  ctx.fillRect(-11, -13, 22, 16);
  ctx.fillStyle = jerseyColor;
  ctx.fillRect(-9.5, -11.5, 19, 13);

  // Jersey stripe / collar
  ctx.fillStyle = flash ? '#ffffff' : team.secondaryColor;
  ctx.fillRect(-9.5, -11.5, 19, 3);

  // Jersey number
  if (!flash) {
    ctx.fillStyle = p.team === 1 && team.id === 'samba' ? '#14532d' : '#ffffff';
    ctx.font = '800 8px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(p.number), 0, -4);
  }

  // Chibi Nekketsu Head
  ctx.fillStyle = '#090d14';
  ctx.fillRect(-10, -29, 20, 17);
  ctx.fillStyle = flash ? '#ffffff' : team.skinColor;
  ctx.fillRect(-8.5, -27.5, 17, 14);

  // Hair + Captain Headband
  ctx.fillStyle = flash ? '#ffffff' : team.hairColor;
  ctx.fillRect(-9.5, -31, 19, 6);
  if (p.isCaptain && !flash) {
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-9.5, -26, 19, 3);
    // Flowing headband tail
    const tailX = facingRight ? -12 : 9;
    ctx.fillRect(tailX, -26, 4, 2.5);
  }

  // Expressive Eyes
  if (!flash) {
    const eyeShift = facingRight ? 2 : -2;
    ctx.fillStyle = '#0f172a';
    if (p.stunTimer > 0) {
      // Dizzy X_X eyes
      ctx.font = '800 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('×', -3.5 + eyeShift * 0.5, -19.5);
      ctx.fillText('×', 3.5 + eyeShift * 0.5, -19.5);
    } else {
      ctx.fillRect(-5 + eyeShift, -21, 3, 4);
      ctx.fillRect(2 + eyeShift, -21, 3, 4);
      // Fierce brow
      ctx.fillRect(-6 + eyeShift, -22.5, 4, 1.5);
      ctx.fillRect(2 + eyeShift, -22.5, 4, 1.5);
    }
  }

  // Orbiting stun stars above head
  if (p.stunTimer > 0) {
    for (let s = 0; s < 3; s++) {
      const ang = nowSec * 9 + (s * Math.PI * 2) / 3;
      const sx = Math.cos(ang) * 12;
      const sy = -36 + Math.sin(ang) * 4;
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();

  // Overhead P1 marker
  if (isActive) {
    const bounce = Math.sin(nowSec * 7) * 2.5;
    const markerY = screenY - 40 + bounce;
    ctx.save();
    ctx.fillStyle = '#fde047';
    ctx.strokeStyle = '#090d14';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x, markerY + 6);
    ctx.lineTo(p.x - 6, markerY - 4);
    ctx.lineTo(p.x + 6, markerY - 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function drawBall(ctx: CanvasRenderingContext2D, state: MatchState, nowSec: number): void {
  const b = state.ball;
  const screenY = b.y - b.z * 0.72;

  // Super shot trail
  if (b.superType) {
    const len = b.trailX.length;
    const trailColor =
      b.superType === 'dragon'
        ? '#ef4444'
        : b.superType === 'banana'
        ? '#facc15'
        : b.superType === 'thunder'
        ? '#38bdf8'
        : '#c084fc';

    ctx.save();
    for (let i = 0; i < len; i++) {
      const idx = (b.trailIndex - i + len) % len;
      const tx = b.trailX[idx];
      const ty = b.trailY[idx] - b.trailZ[idx] * 0.72;
      const alpha = Math.max(0, (1 - i / len) * 0.65);
      const r = BALL_RADIUS * (1 - i / (len * 1.25));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = trailColor;
      ctx.beginPath();
      ctx.arc(tx, ty, Math.max(2, r), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Ball ground shadow
  const shadowScale = Math.max(0.45, 1 - b.z / 130);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.36)';
  ctx.beginPath();
  ctx.ellipse(b.x, b.y + 4, BALL_RADIUS * shadowScale, BALL_RADIUS * 0.55 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ball sphere
  ctx.save();
  ctx.translate(b.x, screenY);

  if (b.superType) {
    // Glowing aura for active super shot
    const auraColor =
      b.superType === 'dragon'
        ? 'rgba(239,68,68,0.48)'
        : b.superType === 'banana'
        ? 'rgba(250,204,21,0.48)'
        : b.superType === 'thunder'
        ? 'rgba(56,189,248,0.52)'
        : 'rgba(192,132,252,0.48)';
    ctx.fillStyle = auraColor;
    ctx.beginPath();
    ctx.arc(0, 0, BALL_RADIUS + 6 + Math.sin(nowSec * 30) * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#090d14';
  ctx.beginPath();
  ctx.arc(0, 0, BALL_RADIUS + 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(0, 0, BALL_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  // Rotating soccer patches
  ctx.rotate(b.spin);
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(0, 0, 3.6, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 7.2, Math.sin(a) * 7.2, 2.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, state: MatchState): void {
  ctx.save();
  for (let i = 0; i < state.particles.length; i++) {
    const pt = state.particles[i];
    if (!pt.active) continue;
    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    ctx.fillStyle = pt.color;
    const py = pt.y - pt.z * 0.72;
    ctx.fillRect(pt.x - pt.size / 2, py - pt.size / 2, pt.size, pt.size);
  }
  ctx.restore();
}

function drawPopups(ctx: CanvasRenderingContext2D, state: MatchState): void {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < state.popups.length; i++) {
    const pop = state.popups[i];
    if (!pop.active) continue;
    const alpha = Math.min(1, (pop.life / pop.maxLife) * 1.4);
    ctx.globalAlpha = alpha;
    const fontSize = Math.round(18 * pop.scale);
    ctx.font = `900 ${fontSize}px "Chakra Petch", "Noto Sans SC", sans-serif`;
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#090d14';
    ctx.strokeText(pop.text, pop.x, pop.y);
    ctx.fillStyle = pop.color;
    ctx.fillText(pop.text, pop.x, pop.y);
  }
  ctx.restore();
}

function drawCenterBanner(ctx: CanvasRenderingContext2D, text: string, accent: string): void {
  ctx.save();
  ctx.fillStyle = 'rgba(9, 13, 20, 0.78)';
  ctx.fillRect(PITCH_W / 2 - 190, PITCH_H / 2 - 42, 380, 84);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  ctx.strokeRect(PITCH_W / 2 - 190, PITCH_H / 2 - 42, 380, 84);

  ctx.font = '900 36px "Chakra Petch", "Noto Sans SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#090d14';
  ctx.strokeText(text, PITCH_W / 2, PITCH_H / 2);
  ctx.fillStyle = '#f8fafc';
  ctx.fillText(text, PITCH_W / 2, PITCH_H / 2);
  ctx.restore();
}
