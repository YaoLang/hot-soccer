import { useCallback, useEffect, useRef, useState } from 'react';
import { GameHud } from './components/GameHud';
import { GameOverModal, PauseModal } from './components/Modals';
import { TitleScreen } from './components/TitleScreen';
import { TouchControls, TouchInputBridge } from './components/TouchControls';
import { soundEngine } from './game/audio';
import { createMatchState, extractHudSnapshot, stepMatch } from './game/engine';
import { renderMatch } from './game/renderer';
import { Difficulty, GameModeState, HudSnapshot, InputState, MatchState, TEAMS } from './game/types';
import { downloadStandaloneSingleHtml } from './utils/singleHtmlExporter';

const INITIAL_HUD: HudSnapshot = {
  scoreHome: 0,
  scoreAway: 0,
  timeRemaining: 90,
  phase: 'kickoff',
  superGaugeHome: 35,
  superGaugeAway: 25,
  lastScorerTeam: null,
  hasBallHome: false,
  stats: {
    homeShots: 0,
    awayShots: 0,
    homeSuperShots: 0,
    awaySuperShots: 0,
    homeTackles: 0,
    awayTackles: 0,
  },
};

export default function App() {
  const [gameState, setGameState] = useState<GameModeState>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') return 'playing';
    }
    return 'title';
  });

  const [homeTeamId, setHomeTeamId] = useState<string>(TEAMS[0].id);
  const [awayTeamId, setAwayTeamId] = useState<string>(TEAMS[1].id);
  const [difficulty, setDifficulty] = useState<Difficulty>('hotblood');
  const [durationSec, setDurationSec] = useState<number>(90);
  const [muted, setMuted] = useState<boolean>(false);
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [simulatedLandscape, setSimulatedLandscape] = useState<boolean>(false);
  const [showTouchPad, setShowTouchPad] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(pointer: coarse)').matches ||
      'ontouchstart' in window ||
      window.innerWidth <= 960
    );
  });

  const shellRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const gameStateRef = useRef<GameModeState>(gameState);
  const configRef = useRef({ homeTeamId, awayTeamId, difficulty, durationSec });
  configRef.current = { homeTeamId, awayTeamId, difficulty, durationSec };

  const matchRef = useRef<MatchState>(
    createMatchState({
      homeTeamId,
      awayTeamId,
      difficulty,
      durationSec,
      attractMode: gameState === 'title',
    })
  );

  // Unified Keyboard + Touch Input Hub
  const keysRef = useRef<Set<string>>(new Set());
  const pendingEdgesRef = useRef({
    passJustPressed: false,
    shootJustPressed: false,
    shootJustReleased: false,
    jumpSuperJustPressed: false,
  });

  const touchBridgeRef = useRef<TouchInputBridge>({
    moveX: 0,
    moveY: 0,
    dashHeld: false,
    shootHeld: false,
    onPass: () => {
      soundEngine.unlock();
      pendingEdgesRef.current.passJustPressed = true;
    },
    onShootDown: () => {
      soundEngine.unlock();
      pendingEdgesRef.current.shootJustPressed = true;
    },
    onShootUp: () => {
      pendingEdgesRef.current.shootJustReleased = true;
    },
    onJumpSuper: () => {
      soundEngine.unlock();
      pendingEdgesRef.current.jumpSuperJustPressed = true;
    },
  });

  const syncBodyState = (next: GameModeState) => {
    gameStateRef.current = next;
    setGameState(next);
    if (typeof document !== 'undefined') {
      document.body.dataset.state = next;
    }
  };

  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  const clearInputs = useCallback(() => {
    keysRef.current.clear();
    touchBridgeRef.current.moveX = 0;
    touchBridgeRef.current.moveY = 0;
    touchBridgeRef.current.dashHeld = false;
    touchBridgeRef.current.shootHeld = false;
    pendingEdgesRef.current.passJustPressed = false;
    pendingEdgesRef.current.shootJustPressed = false;
    pendingEdgesRef.current.shootJustReleased = false;
    pendingEdgesRef.current.jumpSuperJustPressed = false;
  }, []);

  const startMatch = useCallback(() => {
    soundEngine.unlock();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    clearInputs();
    const cfg = configRef.current;
    const fresh = createMatchState({
      homeTeamId: cfg.homeTeamId,
      awayTeamId: cfg.awayTeamId,
      difficulty: cfg.difficulty,
      durationSec: cfg.durationSec,
      attractMode: false,
    });
    matchRef.current = fresh;
    setHud(extractHudSnapshot(fresh));
    syncBodyState('playing');
    soundEngine.play('whistle');
    canvasRef.current?.focus();
  }, [clearInputs]);

  const backToTitle = useCallback(() => {
    clearInputs();
    const cfg = configRef.current;
    const demo = createMatchState({
      homeTeamId: cfg.homeTeamId,
      awayTeamId: cfg.awayTeamId,
      difficulty: cfg.difficulty,
      durationSec: cfg.durationSec,
      attractMode: true,
    });
    matchRef.current = demo;
    syncBodyState('title');
  }, [clearInputs]);

  const pauseMatch = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;
    clearInputs();
    syncBodyState('paused');
  }, [clearInputs]);

  const resumeMatch = useCallback(() => {
    if (gameStateRef.current !== 'paused') return;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    clearInputs();
    syncBodyState('playing');
    canvasRef.current?.focus();
  }, [clearInputs]);

  const toggleMute = useCallback(() => {
    const next = soundEngine.toggleMute();
    setMuted(next);
  }, []);

  const toggleLandscape = useCallback(() => {
    soundEngine.unlock();
    const isPortrait = window.innerHeight > window.innerWidth;

    if (!simulatedLandscape) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      const orient = screen.orientation as ScreenOrientation & {
        lock?: (o: string) => Promise<void>;
      };
      if (orient && typeof orient.lock === 'function') {
        orient.lock('landscape').catch(() => {
          if (isPortrait) setSimulatedLandscape(true);
        });
      }
      if (isPortrait) {
        setSimulatedLandscape(true);
        setShowTouchPad(true);
      }
    } else {
      setSimulatedLandscape(false);
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, [simulatedLandscape]);

  // Keep attract-mode teams synced when user switches teams on Title Screen
  useEffect(() => {
    if (gameStateRef.current === 'title') {
      matchRef.current = createMatchState({
        homeTeamId,
        awayTeamId,
        difficulty,
        durationSec,
        attractMode: true,
      });
    }
  }, [homeTeamId, awayTeamId, difficulty, durationSec]);

  // Keyboard Listeners & Focus-Loss Hygiene
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      soundEngine.unlock();

      if (gameStateRef.current === 'title') {
        if ((e.code === 'Enter' || e.code === 'Space') && !e.repeat) {
          startMatch();
        }
        return;
      }

      if ((e.code === 'Escape' || e.code === 'KeyP') && !e.repeat) {
        if (gameStateRef.current === 'playing') pauseMatch();
        else if (gameStateRef.current === 'paused') resumeMatch();
        return;
      }

      if (e.code === 'KeyM' && !e.repeat) {
        toggleMute();
        return;
      }

      if (gameStateRef.current !== 'playing') return;

      keysRef.current.add(e.code);

      if (!e.repeat) {
        if (e.code === 'KeyJ' || e.code === 'KeyZ') {
          pendingEdgesRef.current.passJustPressed = true;
        }
        if (e.code === 'KeyK' || e.code === 'KeyX') {
          pendingEdgesRef.current.shootJustPressed = true;
        }
        if (e.code === 'Space' || e.code === 'KeyL' || e.code === 'KeyC') {
          pendingEdgesRef.current.jumpSuperJustPressed = true;
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
      if (gameStateRef.current === 'playing' && (e.code === 'KeyK' || e.code === 'KeyX')) {
        pendingEdgesRef.current.shootJustReleased = true;
      }
    };

    const onBlur = () => clearInputs();
    const onVisibility = () => {
      if (document.hidden) clearInputs();
    };
    const onTouchDetect = () => {
      setShowTouchPad(true);
    };
    const onResizeDetect = () => {
      if (window.innerWidth <= 960) {
        setShowTouchPad(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('touchstart', onTouchDetect, { once: true, passive: true });
    window.addEventListener('resize', onResizeDetect);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('touchstart', onTouchDetect);
      window.removeEventListener('resize', onResizeDetect);
    };
  }, [clearInputs, pauseMatch, resumeMatch, startMatch, toggleMute]);

  // Canvas Size Observer + 60Hz Decoupled Simulation & Render Loop
  useEffect(() => {
    const shell = shellRef.current;
    const canvas = canvasRef.current;
    if (!shell || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const syncCanvasSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(320, shell.clientWidth);
      const h = Math.max(240, shell.clientHeight);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
    };

    syncCanvasSize();
    const observer = new ResizeObserver(syncCanvasSize);
    observer.observe(shell);

    let rafId = 0;
    let lastTime = performance.now();
    let lastHudSignature = '';

    const frame = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
      lastTime = now;

      const mode = gameStateRef.current;
      const st = matchRef.current;

      if (mode === 'title' || mode === 'playing') {
        const keys = keysRef.current;
        const tb = touchBridgeRef.current;
        const edges = pendingEdgesRef.current;

        const kbX =
          (keys.has('ArrowRight') || keys.has('KeyD') ? 1 : 0) -
          (keys.has('ArrowLeft') || keys.has('KeyA') ? 1 : 0);
        const kbY =
          (keys.has('ArrowDown') || keys.has('KeyS') ? 1 : 0) -
          (keys.has('ArrowUp') || keys.has('KeyW') ? 1 : 0);

        const input: InputState = {
          moveX: mode === 'playing' ? Math.max(-1, Math.min(1, kbX + tb.moveX)) : 0,
          moveY: mode === 'playing' ? Math.max(-1, Math.min(1, kbY + tb.moveY)) : 0,
          dashHeld:
            mode === 'playing' &&
            (keys.has('ShiftLeft') || keys.has('ShiftRight') || tb.dashHeld),
          passJustPressed: mode === 'playing' && edges.passJustPressed,
          shootHeld:
            mode === 'playing' && (keys.has('KeyK') || keys.has('KeyX') || tb.shootHeld),
          shootJustPressed: mode === 'playing' && edges.shootJustPressed,
          shootJustReleased: mode === 'playing' && edges.shootJustReleased,
          jumpSuperJustPressed: mode === 'playing' && edges.jumpSuperJustPressed,
        };

        edges.passJustPressed = false;
        edges.shootJustPressed = false;
        edges.shootJustReleased = false;
        edges.jumpSuperJustPressed = false;

        stepMatch(st, input, dt);

        if (mode === 'playing') {
          soundEngine.playEvents(st.events);

          if (st.phase === 'fulltime') {
            setHud(extractHudSnapshot(st));
            syncBodyState('gameover');
          } else {
            const snap = extractHudSnapshot(st);
            const sig = `${snap.scoreHome}:${snap.scoreAway}:${snap.timeRemaining}:${snap.phase}:${snap.superGaugeHome}:${snap.hasBallHome}`;
            if (sig !== lastHudSignature) {
              lastHudSignature = sig;
              setHud(snap);
            }
          }
        }
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = canvas.width / dpr;
      const cssH = canvas.height / dpr;
      ctx.save();
      ctx.scale(dpr, dpr);
      renderMatch(ctx, cssW, cssH, st, now / 1000);
      ctx.restore();

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={shellRef}
      className={simulatedLandscape ? 'simulated-landscape bg-[#0d141d]' : 'fixed inset-0 bg-[#0d141d]'}
    >
      <canvas
        ref={canvasRef}
        tabIndex={0}
        data-testid="soccer-canvas"
        aria-label="热血足球比赛场地"
        className="block h-full w-full outline-none"
      />

      {gameState === 'title' && (
        <TitleScreen
          homeTeamId={homeTeamId}
          awayTeamId={awayTeamId}
          difficulty={difficulty}
          durationSec={durationSec}
          simulatedLandscape={simulatedLandscape}
          onSelectHome={setHomeTeamId}
          onSelectAway={setAwayTeamId}
          onSelectDifficulty={setDifficulty}
          onSelectDuration={setDurationSec}
          onStart={startMatch}
          onToggleLandscape={toggleLandscape}
          onDownloadSingleHtml={downloadStandaloneSingleHtml}
        />
      )}

      {gameState !== 'title' && (
        <GameHud
          hud={hud}
          homeTeamId={homeTeamId}
          awayTeamId={awayTeamId}
          muted={muted}
          showTouchPad={showTouchPad}
          simulatedLandscape={simulatedLandscape}
          onToggleMute={toggleMute}
          onToggleTouchPad={() => setShowTouchPad((v) => !v)}
          onToggleLandscape={toggleLandscape}
          onPause={() => {
            if (gameState === 'playing') pauseMatch();
            else if (gameState === 'paused') resumeMatch();
          }}
        />
      )}

      {gameState === 'playing' && (
        <TouchControls
          bridge={touchBridgeRef.current}
          superReady={hud.superGaugeHome >= 100}
          hasBall={hud.hasBallHome}
          simulatedLandscape={simulatedLandscape}
          visible={showTouchPad}
        />
      )}

      {gameState === 'paused' && (
        <PauseModal
          onResume={resumeMatch}
          onRestart={startMatch}
          onBackToTitle={backToTitle}
          onDownloadSingleHtml={downloadStandaloneSingleHtml}
        />
      )}

      {gameState === 'gameover' && (
        <GameOverModal
          hud={hud}
          homeTeamId={homeTeamId}
          awayTeamId={awayTeamId}
          onPlayAgain={startMatch}
          onBackToTitle={backToTitle}
        />
      )}
    </div>
  );
}
