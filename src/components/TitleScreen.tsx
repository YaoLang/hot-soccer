import React from 'react';
import { Download, Maximize2, Play, RotateCw } from 'lucide-react';
import { Difficulty, TEAMS } from '../game/types';

interface TitleScreenProps {
  homeTeamId: string;
  awayTeamId: string;
  difficulty: Difficulty;
  durationSec: number;
  simulatedLandscape: boolean;
  onSelectHome: (id: string) => void;
  onSelectAway: (id: string) => void;
  onSelectDifficulty: (d: Difficulty) => void;
  onSelectDuration: (sec: number) => void;
  onStart: () => void;
  onToggleLandscape: () => void;
  onDownloadSingleHtml: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  homeTeamId,
  awayTeamId,
  difficulty,
  durationSec,
  simulatedLandscape,
  onSelectHome,
  onSelectAway,
  onSelectDifficulty,
  onSelectDuration,
  onStart,
  onToggleLandscape,
  onDownloadSingleHtml,
}) => {
  const selectedHome = TEAMS.find((t) => t.id === homeTeamId) ?? TEAMS[0];

  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-between overflow-y-auto bg-gradient-to-r from-[#09101a]/92 via-[#09101a]/78 to-[#09101a]/62 px-4 py-3 sm:px-8 sm:py-5">
      {/* Top Bar: Inline SVG Emblem + Utility Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Bespoke Inline SVG Title Crest */}
          <svg
            viewBox="0 0 64 64"
            className="h-11 w-11 shrink-0 sm:h-14 sm:w-14"
            aria-hidden="true"
          >
            <polygon
              points="32,3 59,16 54,48 32,61 10,48 5,16"
              fill="#dc2626"
              stroke="#fde047"
              strokeWidth="3.5"
            />
            <polygon points="32,9 52,19 48,44 32,54 16,44 12,19" fill="#0f172a" />
            <circle cx="32" cy="31" r="13" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
            <polygon points="32,23 38,28 36,35 28,35 26,28" fill="#1e293b" />
            <path d="M11 22 L22 25 L14 31 Z" fill="#facc15" />
            <path d="M53 22 L42 25 L50 31 Z" fill="#facc15" />
          </svg>

          <div>
            <h1 className="font-display text-2xl font-black tracking-tight text-white sm:text-4xl">
              热血足球
            </h1>
            <p className="text-xs font-semibold tracking-wide text-amber-300 sm:text-sm">
              NEKKETSU MOBILE SOCCER · 4V4 必杀街机杯
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleLandscape}
            className="inline-flex h-10 items-center gap-1.5 border-2 border-slate-700 bg-[#15202e] px-3 text-xs font-bold text-slate-100 whitespace-nowrap arcade-btn hover:border-amber-400"
          >
            {simulatedLandscape ? <RotateCw className="h-3.5 w-3.5 text-emerald-400" /> : <Maximize2 className="h-3.5 w-3.5 text-amber-300" />}
            <span>{simulatedLandscape ? '恢复竖屏' : '横屏全屏'}</span>
          </button>

          <button
            type="button"
            onClick={onDownloadSingleHtml}
            className="inline-flex h-10 items-center gap-1.5 border-2 border-slate-700 bg-[#15202e] px-3 text-xs font-bold text-slate-100 whitespace-nowrap arcade-btn hover:border-sky-400"
          >
            <Download className="h-3.5 w-3.5 text-sky-400" />
            <span>下载单HTML</span>
          </button>
        </div>
      </div>

      {/* Main Content: Team Selection & Match Settings */}
      <div className="my-auto grid gap-4 py-2 lg:grid-cols-[1.25fr_0.9fr] lg:items-center lg:gap-8">
        {/* Left: Team Grid */}
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-sm font-bold tracking-wide text-slate-200 sm:text-base">
              选择我方战队
            </h2>
            <span className="text-xs text-slate-400">
              对手：{TEAMS.find((t) => t.id === awayTeamId)?.name}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
            {TEAMS.map((team) => {
              const isSelected = team.id === homeTeamId;
              return (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => {
                    onSelectHome(team.id);
                    if (team.id === awayTeamId) {
                      const nextAway = TEAMS.find((t) => t.id !== team.id) ?? TEAMS[1];
                      onSelectAway(nextAway.id);
                    }
                  }}
                  className={`flex flex-col items-start border-2 p-2.5 text-left transition-colors sm:p-3 ${
                    isSelected
                      ? 'border-amber-400 bg-[#162233]'
                      : 'border-slate-800 bg-[#0e1724]/90 hover:border-slate-600'
                  }`}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-3.5 w-3.5 shrink-0 border border-black"
                        style={{ backgroundColor: team.primaryColor }}
                        aria-hidden="true"
                      />
                      <span className="text-sm font-black text-white whitespace-nowrap">
                        {team.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">
                      {team.captainName}
                    </span>
                  </div>

                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-amber-300">
                    <span>必杀</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-bold">{team.superName}</span>
                  </div>

                  <div className="mt-2 grid w-full grid-cols-3 gap-1.5 text-[10px] text-slate-400">
                    <div>
                      <span>速度 </span>
                      <span className="font-mono-num font-bold text-slate-200">{team.speedRating}</span>
                    </div>
                    <div>
                      <span>力量 </span>
                      <span className="font-mono-num font-bold text-slate-200">{team.powerRating}</span>
                    </div>
                    <div>
                      <span>技巧 </span>
                      <span className="font-mono-num font-bold text-slate-200">{team.techniqueRating}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Match Options + Primary Kickoff CTA */}
        <div className="flex flex-col gap-3 border-2 border-slate-800 bg-[#0e1724]/95 p-3.5 sm:p-5 arcade-shadow">
          <div>
            <div className="text-xs font-bold text-slate-400">必杀技说明</div>
            <div className="mt-0.5 text-sm font-bold text-white">
              {selectedHome.superName} —{' '}
              <span className="font-normal text-slate-300">{selectedHome.superDesc}</span>
            </div>
          </div>

          {/* Opponent Selector */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-2.5">
            <span className="text-xs font-bold text-slate-300">对手战队</span>
            <div className="flex flex-wrap gap-1">
              {TEAMS.filter((t) => t.id !== homeTeamId).map((opp) => (
                <button
                  key={opp.id}
                  type="button"
                  onClick={() => onSelectAway(opp.id)}
                  className={`px-2.5 py-1 text-xs font-bold whitespace-nowrap transition-colors ${
                    awayTeamId === opp.id
                      ? 'bg-sky-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {opp.shortName}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-300">AI 强度</span>
            <div className="flex gap-1">
              {(
                [
                  { id: 'rookie', label: '新手' },
                  { id: 'hotblood', label: '热血' },
                  { id: 'legend', label: '地狱' },
                ] as const
              ).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onSelectDifficulty(d.id)}
                  className={`px-2.5 py-1 text-xs font-bold whitespace-nowrap transition-colors ${
                    difficulty === d.id
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-300">比赛时长</span>
            <div className="flex gap-1">
              {[60, 90, 120].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => onSelectDuration(sec)}
                  className={`font-mono-num px-2.5 py-1 text-xs font-bold whitespace-nowrap transition-colors ${
                    durationSec === sec
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {sec}秒
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            data-start="true"
            onClick={onStart}
            className="mt-1 flex h-12 w-full items-center justify-center gap-2 border-2 border-amber-200 bg-red-600 text-base font-black tracking-wider text-white arcade-btn hover:bg-red-500"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>开始比赛</span>
          </button>
        </div>
      </div>

      {/* Bottom Flat Control Hint Line */}
      <div className="text-center text-xs font-medium text-slate-400">
        WASD / 虚拟摇杆 移动 · J/Z 传球换人 · K/X 蓄力射门/飞铲 · Space/L 跳跃倒钩与必杀 · P 暂停
      </div>
    </div>
  );
};
