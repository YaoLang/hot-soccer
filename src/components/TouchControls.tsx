import React, { useRef, useState } from 'react';

export interface TouchInputBridge {
  moveX: number;
  moveY: number;
  dashHeld: boolean;
  shootHeld: boolean;
  onPass: () => void;
  onShootDown: () => void;
  onShootUp: () => void;
  onJumpSuper: () => void;
}

interface TouchControlsProps {
  bridge: TouchInputBridge;
  superReady: boolean;
  hasBall: boolean;
  simulatedLandscape: boolean;
  visible: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  bridge,
  superReady,
  hasBall,
  simulatedLandscape,
  visible,
}) => {
  const padRef = useRef<HTMLDivElement | null>(null);
  const activePointerId = useRef<number | null>(null);
  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dashActive, setDashActive] = useState(false);
  const [shootActive, setShootActive] = useState(false);

  if (!visible) return null;

  const maxRadius = 42;

  const updateJoystickFromEvent = (clientX: number, clientY: number) => {
    const el = padRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    let rawDx = clientX - cx;
    let rawDy = clientY - cy;

    // When container is CSS rotated +90deg clockwise, map screen delta back to local coordinates
    if (simulatedLandscape) {
      const localX = rawDy;
      const localY = -rawDx;
      rawDx = localX;
      rawDy = localY;
    }

    const dist = Math.hypot(rawDx, rawDy);
    const clampedDist = Math.min(maxRadius, dist);
    const angle = Math.atan2(rawDy, rawDx);
    const kx = dist > 2 ? Math.cos(angle) * clampedDist : 0;
    const ky = dist > 2 ? Math.sin(angle) * clampedDist : 0;

    setKnobOffset({ x: kx, y: ky });
    bridge.moveX = clampedDist > 5 ? kx / maxRadius : 0;
    bridge.moveY = clampedDist > 5 ? ky / maxRadius : 0;
  };

  const handlePadPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    activePointerId.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateJoystickFromEvent(e.clientX, e.clientY);
  };

  const handlePadPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== e.pointerId) return;
    e.preventDefault();
    updateJoystickFromEvent(e.clientX, e.clientY);
  };

  const resetJoystick = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== e.pointerId) return;
    activePointerId.current = null;
    setKnobOffset({ x: 0, y: 0 });
    bridge.moveX = 0;
    bridge.moveY = 0;
  };

  return (
    <div
      className="pointer-events-none fixed inset-0 z-20 flex items-end justify-between px-4 pb-4 sm:px-7 sm:pb-6"
      aria-label="虚拟手柄控制区"
    >
      {/* Left Analog D-Pad */}
      <div className="pointer-events-auto flex items-end gap-3">
        <div
          ref={padRef}
          onPointerDown={handlePadPointerDown}
          onPointerMove={handlePadPointerMove}
          onPointerUp={resetJoystick}
          onPointerCancel={resetJoystick}
          role="application"
          aria-label="方向摇杆"
          className="relative flex h-28 w-28 touch-none items-center justify-center rounded-full border-2 border-white/25 bg-[#0d141d]/55 shadow-lg sm:h-32 sm:w-32"
        >
          {/* Crosshair guide */}
          <div className="pointer-events-none absolute inset-4 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute h-0.5 w-16 bg-white/10" />
          <div className="pointer-events-none absolute h-16 w-0.5 bg-white/10" />

          {/* Thumb Knob */}
          <div
            className="pointer-events-none h-12 w-12 rounded-full border-2 border-amber-300 bg-amber-400/90 shadow-md"
            style={{
              transform: `translate3d(${knobOffset.x}px, ${knobOffset.y}px, 0)`,
            }}
          />
        </div>
      </div>

      {/* Right Arcade Action Cluster */}
      <div className="pointer-events-auto flex items-end gap-2.5 sm:gap-3.5">
        {/* Dash Button */}
        <button
          type="button"
          tabIndex={-1}
          aria-label="冲刺"
          onPointerDown={(e) => {
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            bridge.dashHeld = true;
            setDashActive(true);
          }}
          onPointerUp={() => {
            bridge.dashHeld = false;
            setDashActive(false);
          }}
          onPointerCancel={() => {
            bridge.dashHeld = false;
            setDashActive(false);
          }}
          className={`flex h-14 w-14 touch-none flex-col items-center justify-center rounded-full border-2 text-xs font-bold tracking-tight arcade-btn sm:h-16 sm:w-16 ${
            dashActive
              ? 'border-white bg-sky-500 text-slate-950'
              : 'border-sky-300/70 bg-sky-700/85 text-white'
          }`}
        >
          <span>冲刺</span>
        </button>

        {/* Pass / Switch Button */}
        <button
          type="button"
          tabIndex={-1}
          aria-label={hasBall ? '传球' : '切换球员'}
          onPointerDown={(e) => {
            e.preventDefault();
            bridge.onPass();
          }}
          className="flex h-14 w-14 touch-none flex-col items-center justify-center rounded-full border-2 border-emerald-300/80 bg-emerald-600/90 text-xs font-bold text-white arcade-btn active:bg-emerald-500 sm:h-16 sm:w-16"
        >
          <span>{hasBall ? '传球' : '换人'}</span>
        </button>

        {/* Jump / Instant Super Button */}
        <button
          type="button"
          tabIndex={-1}
          aria-label={superReady && hasBall ? '释放必杀' : '跳跃倒钩'}
          onPointerDown={(e) => {
            e.preventDefault();
            bridge.onJumpSuper();
          }}
          className={`flex h-14 w-14 touch-none flex-col items-center justify-center rounded-full border-2 text-xs font-black arcade-btn sm:h-16 sm:w-16 ${
            superReady
              ? 'border-yellow-200 bg-amber-500 text-slate-950'
              : 'border-amber-300/75 bg-amber-600/85 text-white'
          }`}
        >
          <span>{superReady && hasBall ? '必杀' : '飞踢'}</span>
        </button>

        {/* Shoot / Slide Tackle Primary Button */}
        <button
          type="button"
          tabIndex={-1}
          aria-label={hasBall ? '射门' : '铲球'}
          onPointerDown={(e) => {
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            bridge.shootHeld = true;
            setShootActive(true);
            bridge.onShootDown();
          }}
          onPointerUp={() => {
            bridge.shootHeld = false;
            setShootActive(false);
            bridge.onShootUp();
          }}
          onPointerCancel={() => {
            bridge.shootHeld = false;
            setShootActive(false);
            bridge.onShootUp();
          }}
          className={`flex h-[68px] w-[68px] touch-none flex-col items-center justify-center rounded-full border-2 text-sm font-black arcade-btn sm:h-[76px] sm:w-[76px] ${
            shootActive
              ? 'border-white bg-red-500 text-white'
              : 'border-red-300 bg-red-600/95 text-white'
          }`}
        >
          <span>{hasBall ? '射门' : '铲球'}</span>
        </button>
      </div>
    </div>
  );
};
