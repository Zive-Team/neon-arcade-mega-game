import { useEffect, useRef, useState, useCallback } from 'react';
import { GameShell } from '../components/GameShell';
import type { GameId } from '../types';

const SIZE = 4;
type Grid = number[][];

function empty(): Grid { return Array.from({ length: SIZE }, () => Array<number>(SIZE).fill(0)); }
function clone(g: Grid): Grid { return g.map((r) => [...r]); }

function addRandom(g: Grid): Grid {
  const empties: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (g[r][c] === 0) empties.push([r, c]);
  if (empties.length === 0) return g;
  const [r, c] = empties[Math.floor(Math.random() * empties.length)];
  const ng = clone(g); ng[r][c] = Math.random() < 0.9 ? 2 : 4; return ng;
}

function slide(row: number[]): { row: number[]; gained: number } {
  const filtered = row.filter((v) => v !== 0);
  let gained = 0;
  for (let i = 0; i < filtered.length - 1; i++) {
    if (filtered[i] === filtered[i + 1]) { filtered[i] *= 2; gained += filtered[i]; filtered.splice(i + 1, 1); }
  }
  while (filtered.length < SIZE) filtered.push(0);
  return { row: filtered, gained };
}

function rotate(g: Grid): Grid {
  const ng = empty();
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) ng[c][SIZE - 1 - r] = g[r][c];
  return ng;
}

function move(g: Grid, dir: 'left' | 'right' | 'up' | 'down'): { grid: Grid; gained: number; moved: boolean } {
  let work = clone(g);
  const rotations = dir === 'left' ? 0 : dir === 'up' ? 1 : dir === 'right' ? 2 : 3;
  for (let i = 0; i < rotations; i++) work = rotate(work);
  let gained = 0;
  const newRows = work.map((row) => { const s = slide(row); gained += s.gained; return s.row; });
  work = newRows;
  for (let i = 0; i < (4 - rotations) % 4; i++) work = rotate(work);
  const moved = JSON.stringify(work) !== JSON.stringify(g);
  return { grid: work, gained, moved };
}

function canMove(g: Grid): boolean {
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
    if (g[r][c] === 0) return true;
    if (c < SIZE - 1 && g[r][c] === g[r][c + 1]) return true;
    if (r < SIZE - 1 && g[r][c] === g[r + 1][c]) return true;
  }
  return false;
}

const TILE_COLORS: Record<number, { bg: string; color: string }> = {
  2: { bg: '#1a1f3d', color: '#00f0ff' }, 4: { bg: '#1a2a4d', color: '#00f0ff' },
  8: { bg: '#2d4d1a', color: '#39ff14' }, 16: { bg: '#3d5d2a', color: '#39ff14' },
  32: { bg: '#4d3d1a', color: '#ff7a00' }, 64: { bg: '#5d4d2a', color: '#ff7a00' },
  128: { bg: '#4d1a3d', color: '#ff2bd6' }, 256: { bg: '#5d2a4d', color: '#ff2bd6' },
  512: { bg: '#3d1a4d', color: '#9d4bff' }, 1024: { bg: '#4d2a5d', color: '#9d4bff' },
  2048: { bg: '#4d4d1a', color: '#fff200' }, 4096: { bg: '#5d5d2a', color: '#fff200' },
};

export function Game2048({ onExit, onSwitchGame }: { onExit: () => void; onSwitchGame: (id: GameId) => void }) {
  const [grid, setGrid] = useState<Grid>(() => addRandom(addRandom(empty())));
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [over, setOver] = useState(false);
  const [won, setWon] = useState(false);
  const [keepGoing, setKeepGoing] = useState(false);
  const gridRef = useRef(grid);
  gridRef.current = grid;

  const doMove = useCallback((dir: 'left' | 'right' | 'up' | 'down') => {
    const g = gridRef.current;
    if (over) return;
    const { grid: ng, gained, moved } = move(g, dir);
    if (!moved) return;
    const withNew = addRandom(ng);
    setGrid(withNew); setScore((s) => { const ns = s + gained; if (ns > best) setBest(ns); return ns; });
    if (!won && withNew.some((row) => row.includes(2048))) setWon(true);
    if (!canMove(withNew)) setOver(true);
  }, [over, won, best]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, 'left' | 'right' | 'up' | 'down'> = {
        ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
        a: 'left', d: 'right', w: 'up', s: 'down', A: 'left', D: 'right', W: 'up', S: 'down',
      };
      const dir = map[e.key];
      if (dir) { doMove(dir); e.preventDefault(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doMove]);

  let touchStart: { x: number; y: number } | null = null;
  const onTouchStart = (e: React.TouchEvent) => { touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) doMove(dx > 0 ? 'right' : 'left');
    else doMove(dy > 0 ? 'down' : 'up');
    touchStart = null;
  };

  const reset = () => { setGrid(addRandom(addRandom(empty()))); setScore(0); setOver(false); setWon(false); setKeepGoing(false); };
  const showOverlay = (over || (won && !keepGoing));

  return (
    <GameShell title="フュージョン2048" accent="#ff7a00" onExit={onExit} onSwitchGame={onSwitchGame} currentId="2048"
      hud={<div className="flex flex-col items-end gap-0.5 font-mono text-xs"><span>スコア <span className="text-neon-orange">{score}</span></span><span>ベスト <span className="text-neon-yellow">{best}</span></span></div>}
      instructions="← → ↑ ↓ or スワイプ でパネルを移動 / 同じ数字を重ねて2048を目指す">
      <div className="mx-auto max-w-md" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="relative rounded-xl border-2 border-neon-orange/50 bg-ink-800/80 p-3" style={{ boxShadow: '0 0 16px rgba(255,122,0,0.3)' }}>
          <div className="grid grid-cols-4 gap-2">
            {grid.map((row, r) => row.map((val, c) => {
              const tc = val ? TILE_COLORS[val] ?? { bg: '#5d1a1a', color: '#ff2d55' } : null;
              return (
                <div key={`${r}-${c}`} className="flex h-16 items-center justify-center rounded-lg border transition-all duration-150 sm:h-20" style={{ borderColor: tc ? `${tc.color}44` : '#1a1f3d', background: tc?.bg ?? '#0a0d1f', boxShadow: val >= 128 ? `0 0 12px ${tc!.color}44` : 'none' }}>
                  {val > 0 && <span className="font-display font-900 tracking-wider transition" style={{ color: tc!.color, textShadow: `0 0 8px ${tc!.color}88`, fontSize: val >= 1024 ? '1.1rem' : val >= 128 ? '1.4rem' : '1.7rem' }}>{val}</span>}
                </div>
              );
            }))}
          </div>
          {showOverlay && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-xl bg-ink-900/85 backdrop-blur-sm">
              <p className="font-display text-2xl font-900 tracking-widest" style={{ color: over ? '#ff2d55' : '#fff200', textShadow: `0 0 12px ${over ? '#ff2d55' : '#fff200'}` }}>{over ? 'ゲームオーバー' : '2048達成!'}</p>
              <p className="font-mono text-sm text-cyan-100/70">スコア: {score}</p>
              <div className="flex gap-3">
                {won && !over && !keepGoing && <button onClick={() => setKeepGoing(true)} className="rounded-md border-2 border-neon-yellow bg-neon-yellow/10 px-5 py-2 font-display font-700 uppercase tracking-widest text-neon-yellow transition hover:bg-neon-yellow/20 active:scale-95">続ける</button>}
                <button onClick={reset} className="rounded-md border-2 border-neon-orange bg-neon-orange/10 px-5 py-2 font-display font-700 uppercase tracking-widest text-neon-orange transition hover:bg-neon-orange/20 active:scale-95">リトライ</button>
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:hidden">
          <div />
          <button onClick={() => doMove('up')} className="rounded-md border border-neon-orange/50 bg-neon-orange/10 px-4 py-3 text-neon-orange active:scale-90">↑</button>
          <div />
          <button onClick={() => doMove('left')} className="rounded-md border border-neon-orange/50 bg-neon-orange/10 px-4 py-3 text-neon-orange active:scale-90">←</button>
          <button onClick={() => doMove('down')} className="rounded-md border border-neon-orange/50 bg-neon-orange/10 px-4 py-3 text-neon-orange active:scale-90">↓</button>
          <button onClick={() => doMove('right')} className="rounded-md border border-neon-orange/50 bg-neon-orange/10 px-4 py-3 text-neon-orange active:scale-90">→</button>
        </div>
      </div>
    </GameShell>
  );
}
