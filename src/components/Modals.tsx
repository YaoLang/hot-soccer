import React from 'react';
import { Download, Home, Play, RotateCcw } from 'lucide-react';
import { getTeamConfig } from '../game/engine';
import { HudSnapshot } from '../game/types';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onBackToTitle: () => void;
  onDownloadSingleHtml: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onBackToTitle,
  onDownloadSingleHtml,
}) => {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-title"
    >
      <div className="w-full max-w-sm border-2 border-amber-400 bg-[#0e1724] p-5 arcade-shadow">
        <h2 id="pause-title" className="text-center text-2xl font-black tracking-wide text-white">
          比赛暂停
        </h2>

        <div className="mt-4 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="flex h-11 w-full items-center justify-center gap-2 border-2 border-amber-200 bg-red-600 text-sm font-black text-white arcade-btn hover:bg-red-500"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>继续比赛</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="flex h-11 w-full items-center justify-center gap-2 border-2 border-slate-700 bg-slate-800 text-sm font-bold text-white arcade-btn hover:border-slate-500"
          >
            <RotateCcw className="h-4 w-4" />
            <span>重新开球</span>
          </button>

          <button
            type="button"
            onClick={onDownloadSingleHtml}
            className="flex h-11 w-full items-center justify-center gap-2 border-2 border-slate-700 bg-slate-800 text-sm font-bold text-sky-300 arcade-btn hover:border-sky-400"
          >
            <Download className="h-4 w-4" />
            <span>下载单HTML离线版</span>
          </button>

          <button
            type="button"
            onClick={onBackToTitle}
            className="flex h-11 w-full items-center justify-center gap-2 border-2 border-slate-700 bg-[#121c2b] text-sm font-bold text-slate-300 arcade-btn hover:text-white"
          >
            <Home className="h-4 w-4" />
            <span>返回选队界面</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface GameOverModalProps {
  hud: HudSnapshot;
  homeTeamId: string;
  awayTeamId: string;
  onPlayAgain: () => void;
  onBackToTitle: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  hud,
  homeTeamId,
  awayTeamId,
  onPlayAgain,
  onBackToTitle,
}) => {
  const home = getTeamConfig(homeTeamId);
  const away = getTeamConfig(awayTeamId);
  const won = hud.scoreHome > hud.scoreAway;
  const draw = hud.scoreHome === hud.scoreAway;

  const outcomeTitle = won ? '热血制胜!!' : draw ? '势均力敌 · 平局' : '惜败收场';
  const outcomeColor = won ? 'text-amber-300' : draw ? 'text-sky-300' : 'text-red-400';

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gameover-title"
    >
      <div className="w-full max-w-md border-2 border-amber-400 bg-[#0e1724] p-5 arcade-shadow">
        <div className="text-center">
          <div className="text-xs font-bold tracking-widest text-slate-400">FULL TIME · 全场战罢</div>
          <h2 id="gameover-title" className={`mt-1 text-2xl font-black sm:text-3xl ${outcomeColor}`}>
            {outcomeTitle}
          </h2>
        </div>

        {/* Final Score Display */}
        <div className="mt-4 flex items-center justify-center gap-5 border-2 border-slate-800 bg-[#0a1019] py-3">
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-slate-300">{home.name}</span>
            <span className="font-mono-num text-3xl font-black text-amber-300">{hud.scoreHome}</span>
          </div>
          <span className="text-xl font-black text-slate-500">:</span>
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-slate-300">{away.name}</span>
            <span className="font-mono-num text-3xl font-black text-sky-300">{hud.scoreAway}</span>
          </div>
        </div>

        {/* 3 Stat Tiles */}
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="border border-slate-800 bg-[#121c2b] p-2">
            <div className="text-[11px] font-bold text-slate-400">射门数</div>
            <div className="font-mono-num mt-0.5 text-sm font-extrabold text-white">
              {hud.stats.homeShots} - {hud.stats.awayShots}
            </div>
          </div>
          <div className="border border-slate-800 bg-[#121c2b] p-2">
            <div className="text-[11px] font-bold text-slate-400">必杀射门</div>
            <div className="font-mono-num mt-0.5 text-sm font-extrabold text-amber-300">
              {hud.stats.homeSuperShots} - {hud.stats.awaySuperShots}
            </div>
          </div>
          <div className="border border-slate-800 bg-[#121c2b] p-2">
            <div className="text-[11px] font-bold text-slate-400">飞铲抢断</div>
            <div className="font-mono-num mt-0.5 text-sm font-extrabold text-emerald-400">
              {hud.stats.homeTackles} - {hud.stats.awayTackles}
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2.5">
          <button
            type="button"
            data-start="true"
            onClick={onPlayAgain}
            className="flex h-11 flex-1 items-center justify-center gap-2 border-2 border-amber-200 bg-red-600 text-sm font-black text-white arcade-btn hover:bg-red-500"
          >
            <RotateCcw className="h-4 w-4" />
            <span>再来一局</span>
          </button>

          <button
            type="button"
            onClick={onBackToTitle}
            className="flex h-11 items-center justify-center gap-2 border-2 border-slate-700 bg-slate-800 px-4 text-sm font-bold text-slate-200 arcade-btn hover:text-white"
          >
            <Home className="h-4 w-4" />
            <span>换队</span>
          </button>
        </div>
      </div>
    </div>
  );
};
