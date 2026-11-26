import React from 'react';
import { Gamepad2, Maximize2, Pause, RotateCw, Volume2, VolumeX } from 'lucide-react';
import { getTeamConfig } from '../game/engine';
import { HudSnapshot } from '../game/types';

interface GameHudProps {
  hud: HudSnapshot;
  homeTeamId: string;
  awayTeamId: string;
  muted: boolean;
  showTouchPad: boolean;
  simulatedLandscape: boolean;
  onToggleMute: () => void;
  onToggleTouchPad: () => void;
  onToggleLandscape: () => void;
  onPause: () => void;
}

function formatClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  homeTeamId,
  awayTeamId,
  muted,
  showTouchPad,
  simulatedLandscape,
  onToggleMute,
  onToggleTouchPad,
  onToggleLandscape,
  onPause,
}) => {
  const home = getTeamConfig(homeTeamId);
  const away = getTeamConfig(awayTeamId);
  const superReady = hud.superGaugeHome >= 100;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-start justify-between gap-1 px-2 pt-2 sm:px-5 sm:pt-3">
      {/* Top-Left: Super Meter */}
      <div className="hidden items-center gap-2 border-2 border-slate-900 bg-[#0d141d]/90 px-2.5 py-1.5 arcade-shadow sm:flex">
        <span className="text-[11px] font-bold tracking-wider text-amber-300">热血槽</span>
        <div className="h-2.5 w-24 overflow-hidden bg-slate-800">
          <div
            className={`h-full transition-transform duration-100 origin-left ${
              superReady ? 'bg-amber-400' : 'bg-red-500'
            }`}
            style={{ transform: `scaleX(${Math.min(1, hud.superGaugeHome / 100)})` }}
          />
        </div>
        <span className="font-mono-num w-9 text-right text-xs font-extrabold text-white">
          {superReady ? 'MAX' : `${hud.superGaugeHome}%`}
        </span>
      </div>

      {/* Top-Center: Arcade Broadcast Scoreboard */}
      <div className="flex items-center border-2 border-slate-950 bg-[#0d141d]/95 arcade-shadow">
        {/* Home Team */}
        <div className="flex items-center gap-1.5 px-2 py-1 sm:gap-2 sm:px-3.5">
          <span
            className="inline-block h-3 w-3 shrink-0 border border-black/60 sm:h-3.5 sm:w-3.5"
            style={{ backgroundColor: home.primaryColor }}
            aria-hidden="true"
          />
          <span className="text-[11px] font-black tracking-wide text-white whitespace-nowrap sm:text-sm">
            {home.shortName}
          </span>
          <span
            data-testid="score-home"
            className="font-mono-num text-base font-extrabold text-amber-300 sm:text-xl"
          >
            {hud.scoreHome}
          </span>
        </div>

        {/* Clock */}
        <div className="flex flex-col items-center border-x-2 border-slate-800 bg-slate-900 px-2 py-0.5 sm:px-3">
          <span
            data-testid="match-clock"
            className="font-mono-num text-xs font-extrabold leading-tight text-white sm:text-base"
          >
            {formatClock(hud.timeRemaining)}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-tight text-slate-400 sm:hidden">
            {superReady ? '必杀' : `${hud.superGaugeHome}%`}
          </span>
        </div>

        {/* Away Team */}
        <div className="flex items-center gap-1.5 px-2 py-1 sm:gap-2 sm:px-3.5">
          <span
            data-testid="score-away"
            className="font-mono-num text-base font-extrabold text-sky-300 sm:text-xl"
          >
            {hud.scoreAway}
          </span>
          <span className="text-[11px] font-black tracking-wide text-white whitespace-nowrap sm:text-sm">
            {away.shortName}
          </span>
          <span
            className="inline-block h-3 w-3 shrink-0 border border-black/60 sm:h-3.5 sm:w-3.5"
            style={{ backgroundColor: away.primaryColor }}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Top-Right: Compact Utility Icon Controls */}
      <div className="pointer-events-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.currentTarget.blur();
            onToggleTouchPad();
          }}
          aria-label={showTouchPad ? '隐藏虚拟按键' : '显示虚拟按键'}
          title={showTouchPad ? '隐藏虚拟按键' : '显示虚拟按键'}
          className={`flex h-8 w-8 items-center justify-center border-2 border-slate-950 arcade-btn sm:h-9 sm:w-9 ${
            showTouchPad ? 'bg-amber-400 text-slate-950' : 'bg-[#16202e] text-slate-200'
          }`}
        >
          <Gamepad2 className="h-4 w-4" />
        </button>

        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.currentTarget.blur();
            onToggleLandscape();
          }}
          aria-label={simulatedLandscape ? '退出横屏旋转' : '切换横屏模式'}
          title={simulatedLandscape ? '退出横屏旋转' : '切换横屏模式'}
          className={`flex h-8 w-8 items-center justify-center border-2 border-slate-950 arcade-btn sm:h-9 sm:w-9 ${
            simulatedLandscape ? 'bg-emerald-400 text-slate-950' : 'bg-[#16202e] text-slate-200'
          }`}
        >
          {simulatedLandscape ? <RotateCw className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>

        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.currentTarget.blur();
            onToggleMute();
          }}
          aria-label={muted ? '开启音效' : '静音'}
          title={muted ? '开启音效 (M)' : '静音 (M)'}
          className="flex h-8 w-8 items-center justify-center border-2 border-slate-950 bg-[#16202e] text-slate-200 arcade-btn sm:h-9 sm:w-9"
        >
          {muted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4" />}
        </button>

        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.currentTarget.blur();
            onPause();
          }}
          aria-label="暂停游戏"
          title="暂停游戏 (P / Esc)"
          className="flex h-8 w-8 items-center justify-center border-2 border-slate-950 bg-[#16202e] text-white arcade-btn sm:h-9 sm:w-9"
        >
          <Pause className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
