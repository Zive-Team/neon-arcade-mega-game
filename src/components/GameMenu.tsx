import { GAMES, ACCENT_HEX, type GameMeta } from '../types';
import {
  Gamepad2, Sparkles, Download, Smartphone,
  Boxes, Footprints, Rocket, Keyboard, MousePointerClick,
  Brain, SquareStack, Route, Grid3x3, Music,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Boxes, Footprints, Rocket, Keyboard, MousePointerClick,
  Brain, SquareStack, Route, Grid3x3, Music, Gamepad2,
};

interface Props {
  onSelect: (id: GameMeta) => void;
}

export function GameMenu({ onSelect }: Props) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-ink-900 scanlines">
      <div className="pointer-events-none absolute inset-0 cyber-grid-animated opacity-60" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 20% 0%, rgba(0,240,255,0.10), transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(255,43,214,0.10), transparent 50%)',
        }}
      />

      <header className="relative z-10 flex items-center justify-center gap-4 border-b border-neon-cyan/30 px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <Gamepad2 size={28} className="text-neon-cyan" style={{ color: '#00f0ff' }} />
          <div>
            <h1 className="font-display text-xl font-900 tracking-[0.2em] neon-text-cyan sm:text-2xl">ネオン アーケード</h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-neon-magenta/70">メガゲームセンター</p>
          </div>
        </div>
      </header>
        <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border-2 border-neon-green/40 bg-ink-800/60 px-6 py-8 text-center sm:px-10" style={{ boxShadow: '0 0 20px rgba(57,255,20,0.2)' }}>
          <div className="flex items-center gap-2">
            <Smartphone size={22} className="text-neon-green" style={{ color: '#39ff14' }} />
            <h2 className="font-display text-xl font-900 tracking-widest text-neon-green sm:text-2xl" style={{ textShadow: '0 0 8px #39ff14, 0 0 22px rgba(57,255,20,0.5)' }}>公式Androidアプリ登場</h2>
          </div>
          <h3 className="font-display text-base font-700 tracking-wider text-cyan-100/90 sm:text-lg">公式Androidアプリをダウンロード</h3>
          <p className="font-body text-sm text-cyan-100/60 sm:max-w-md">以下のボタンをタップして、最新版のアプリ（APKファイル）を直接インストールできます。</p>
          <a
            href="https://github.com/Zive-Team/neon-arcade-mega-game/tree/main/app/Android/apk"
            download
            className="group mt-2 flex items-center gap-3 rounded-xl border-2 border-neon-green/60 bg-neon-green/10 px-6 py-3 font-display font-700 tracking-widest text-neon-green transition hover:bg-neon-green/20 active:scale-95 sm:px-8 sm:py-4"
            style={{ boxShadow: '0 0 12px rgba(57,255,20,0.3)' }}
          >
            <Download size={22} className="transition group-hover:scale-110" />
            <span>Androidアプリをダウンロード</span>
          </a>
          <p className="font-mono text-[11px] text-cyan-100/40 sm:text-xs">※「有害なファイルの可能性があります」と警告が出る場合は、「続行」または「ダウンロードする」を選択してください。</p>
        </div>
      
      <main className="relative z-10 mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="mb-5 flex items-center gap-3">
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, #00f0ff, transparent)' }} />
          <span className="font-display text-sm font-700 tracking-[0.3em] neon-text-cyan">
            プレイ可能 <span className="font-mono text-xs opacity-70">[{GAMES.length}]</span>
          </span>
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, #00f0ff)' }} />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {GAMES.map((g) => (
            <GameCard key={g.id} game={g} onSelect={onSelect} />
          ))}
        </div>


      </main>
    </div>
  );
}

function GameCard({ game, onSelect }: { game: GameMeta; onSelect: (g: GameMeta) => void }) {
  const hex = ACCENT_HEX[game.accent];
  const Icon = ICON_MAP[game.icon] ?? Gamepad2;
  return (
    <button
      onClick={() => onSelect(game)}
      className="group relative overflow-hidden rounded-xl border bg-ink-800/70 p-5 text-left transition duration-300 hover:-translate-y-1 hover:bg-ink-700/70"
      style={{ borderColor: `${hex}55` }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 0 18px ${hex}66, inset 0 0 18px ${hex}22`)}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = `0 0 0 0 ${hex}`)}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-30 blur-2xl transition group-hover:opacity-60" style={{ background: hex }} />
      <div className="relative flex items-start justify-between">
        <div className="flex h-14 w-14 items-center justify-center rounded-lg border transition group-hover:scale-110" style={{ borderColor: `${hex}88`, background: `${hex}15`, color: hex, boxShadow: `0 0 10px ${hex}55` }}>
          <Icon size={28} />
        </div>
        <span className="rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest" style={{ borderColor: `${hex}66`, color: hex }}>{game.category}</span>
      </div>
      <h3 className="mt-4 font-display text-xl font-700 tracking-wider" style={{ color: hex, textShadow: `0 0 8px ${hex}88` }}>{game.title}</h3>
      <p className="mt-1 font-body text-sm text-cyan-100/70">{game.subtitle}</p>
      <div className="mt-4 flex items-center gap-2 font-mono text-xs uppercase tracking-widest" style={{ color: hex }}>
        <Sparkles size={12} />
        <span>プレイ</span>
        <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${hex}, transparent)` }} />
      </div>
    </button>
  );
}
