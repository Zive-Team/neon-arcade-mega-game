import { useState, type ReactNode } from 'react';
import { ArrowLeft, Home, Menu, X, Gamepad2 } from 'lucide-react';
import { GAMES, ACCENT_HEX, type GameId } from '../types';
import {
  Boxes, Footprints, Rocket, Keyboard, MousePointerClick,
  Brain, SquareStack, Route, Grid3x3, Music,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Boxes, Footprints, Rocket, Keyboard, MousePointerClick,
  Brain, SquareStack, Route, Grid3x3, Music, Gamepad2,
};

interface GameShellProps {
  title: string;
  accent: string;
  onExit: () => void;
  onSwitchGame: (id: GameId) => void;
  currentId: GameId;
  children: ReactNode;
  hud?: ReactNode;
  instructions?: ReactNode;
}

export function GameShell({ title, accent, onExit, onSwitchGame, currentId, children, hud, instructions }: GameShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-ink-900 scanlines">
      <div className="pointer-events-none absolute inset-0 cyber-grid opacity-40" />
      <header
        className="relative z-20 flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-6"
        style={{ borderColor: `${accent}55`, background: `linear-gradient(90deg, ${accent}18, transparent 60%)` }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMenuOpen(true)}
            className="group flex items-center justify-center rounded-md border px-2.5 py-1.5 transition hover:scale-105"
            style={{ borderColor: `${accent}88`, color: accent, boxShadow: `0 0 8px ${accent}55` }}
            aria-label="ゲームメニュー"
          >
            <Menu size={18} />
          </button>
          <button
            onClick={onExit}
            className="group flex items-center gap-2 rounded-md border px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition hover:scale-105"
            style={{ borderColor: `${accent}88`, color: accent, boxShadow: `0 0 8px ${accent}55` }}
          >
            <ArrowLeft size={14} className="transition group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">メニュー</span>
          </button>
          <Home size={16} className="cursor-pointer transition hover:scale-110" style={{ color: accent }} onClick={onExit} />
        </div>
        <h1 className="font-display text-lg font-700 tracking-[0.2em] sm:text-2xl" style={{ color: accent, textShadow: `0 0 8px ${accent}, 0 0 22px ${accent}88` }}>
          {title}
        </h1>
        <div className="min-w-[80px] text-right font-mono text-xs sm:text-sm">{hud}</div>
      </header>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <nav
            className="fixed left-0 top-0 z-50 flex h-full w-72 max-w-[85vw] flex-col border-r bg-ink-800/95 shadow-2xl animate-slideIn"
            style={{ borderColor: `${accent}44` }}
          >
            <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: `${accent}33` }}>
              <div className="flex items-center gap-2">
                <Gamepad2 size={20} style={{ color: accent }} />
                <span className="font-display text-sm font-700 tracking-widest" style={{ color: accent }}>ゲーム切替</span>
              </div>
              <button onClick={() => setMenuOpen(false)} className="rounded-md p-1.5 transition hover:bg-ink-600" style={{ color: accent }}>
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {GAMES.map((g) => {
                const hex = ACCENT_HEX[g.accent];
                const Icon = ICON_MAP[g.icon] ?? Gamepad2;
                const active = g.id === currentId;
                return (
                  <button
                    key={g.id}
                    onClick={() => { setMenuOpen(false); onSwitchGame(g.id); }}
                    className="group mb-1 flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition"
                    style={{
                      borderColor: active ? `${hex}aa` : 'transparent',
                      background: active ? `${hex}18` : 'transparent',
                      boxShadow: active ? `0 0 10px ${hex}44` : 'none',
                    }}
                    onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = `${hex}0d`; e.currentTarget.style.borderColor = `${hex}55`; } }}
                    onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; } }}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border" style={{ borderColor: `${hex}66`, background: `${hex}12`, color: hex }}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-sm font-700 tracking-wide truncate" style={{ color: active ? hex : '#e6f7ff' }}>{g.title}</p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-cyan-100/50 truncate">{g.category}</p>
                    </div>
                    {active && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: hex, boxShadow: `0 0 6px ${hex}` }} />}
                  </button>
                );
              })}
            </div>
            <div className="border-t p-3" style={{ borderColor: `${accent}33` }}>
              <button
                onClick={() => { setMenuOpen(false); onExit(); }}
                className="flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2.5 font-mono text-xs uppercase tracking-widest transition hover:scale-[1.02]"
                style={{ borderColor: `${accent}66`, color: accent }}
              >
                <Home size={14} />
                メニューに戻る
              </button>
            </div>
          </nav>
        </>
      )}

      <main className="relative z-10 flex flex-1 items-center justify-center p-3 sm:p-6">
        <div className="relative w-full max-w-5xl">{children}</div>
      </main>
      {instructions && (
        <footer className="relative z-10 border-t border-ink-600/60 px-4 py-2 text-center font-mono text-[11px] text-neon-cyan/70 sm:text-xs">
          {instructions}
        </footer>
      )}
    </div>
  );
}
