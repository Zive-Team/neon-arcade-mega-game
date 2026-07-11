import { useEffect, useRef } from 'react';
import { GameShell } from '../components/GameShell';
import { useGameLoop } from '../hooks/useGameLoop';
import type { GameId } from '../types';

const COLS = 24;
const ROWS = 24;
const CELL = 20;
const W = COLS * CELL;
const H = ROWS * CELL;

type Pt = { x: number; y: number };

function randFood(snake: Pt[]): Pt {
  let f: Pt;
  do { f = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }; } while (snake.some((s) => s.x === f.x && s.y === f.y));
  return f;
}

export function SnakeGame({ onExit, onSwitchGame }: { onExit: () => void; onSwitchGame: (id: GameId) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const bestRef = useRef<HTMLSpanElement>(null);
  const overRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<HTMLDivElement>(null);
  const state = useRef({
    snake: [{ x: 12, y: 12 }] as Pt[], dir: { x: 1, y: 0 } as Pt, nextDir: { x: 1, y: 0 } as Pt,
    food: { x: 5, y: 12 } as Pt, score: 0, best: 0, over: false, tickAcc: 0, tickInterval: 130, started: false,
  });

  const reset = () => {
    const s = state.current; const snake = [{ x: 12, y: 12 }];
    s.snake = snake; s.dir = { x: 1, y: 0 }; s.nextDir = { x: 1, y: 0 }; s.food = randFood(snake); s.score = 0; s.over = false; s.tickAcc = 0; s.tickInterval = 130; s.started = true;
    if (overRef.current) overRef.current.style.display = 'none';
    if (startRef.current) startRef.current.style.display = 'none';
    if (scoreRef.current) scoreRef.current.textContent = '0';
  };

  const draw = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const s = state.current;
    ctx.fillStyle = '#05060f'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(0,240,255,0.06)'; ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, H); ctx.stroke(); }
    for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(W, y * CELL); ctx.stroke(); }
    ctx.fillStyle = '#ff2bd6'; ctx.shadowColor = '#ff2bd6'; ctx.shadowBlur = 12;
    ctx.fillRect(s.food.x * CELL + 3, s.food.y * CELL + 3, CELL - 6, CELL - 6); ctx.shadowBlur = 0;
    s.snake.forEach((seg, i) => {
      const isHead = i === 0;
      const color = isHead ? '#39ff14' : `hsl(${120 - i * 2}, 100%, ${50 - Math.min(i, 20)}%)`;
      ctx.fillStyle = color; ctx.shadowColor = '#39ff14'; ctx.shadowBlur = isHead ? 12 : 4;
      ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2); ctx.shadowBlur = 0;
      if (isHead) { ctx.fillStyle = '#05060f'; const ex = seg.x * CELL + CELL / 2 + s.dir.x * 4; const ey = seg.y * CELL + CELL / 2 + s.dir.y * 4; ctx.fillRect(ex - 2, ey - 2, 4, 4); }
    });
  };

  useGameLoop((dt) => {
    const s = state.current; if (!s.started || s.over) return;
    s.tickAcc += dt;
    if (s.tickAcc < s.tickInterval) return;
    s.tickAcc = 0;
    s.dir = s.nextDir;
    const head = s.snake[0]; const nh = { x: head.x + s.dir.x, y: head.y + s.dir.y };
    if (nh.x < 0 || nh.x >= COLS || nh.y < 0 || nh.y >= ROWS || s.snake.some((seg) => seg.x === nh.x && seg.y === nh.y)) { s.over = true; if (s.score > s.best) { s.best = s.score; if (bestRef.current) bestRef.current.textContent = String(s.best); } if (overRef.current) overRef.current.style.display = 'flex'; return; }
    s.snake.unshift(nh);
    if (nh.x === s.food.x && nh.y === s.food.y) { s.score += 10; if (scoreRef.current) scoreRef.current.textContent = String(s.score); s.food = randFood(s.snake); s.tickInterval = Math.max(60, 130 - s.score * 0.5); }
    else s.snake.pop();
    draw();
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = state.current; if (s.over) return;
      const d = s.dir;
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': if (d.y === 0) s.nextDir = { x: 0, y: -1 }; e.preventDefault(); break;
        case 'ArrowDown': case 's': case 'S': if (d.y === 0) s.nextDir = { x: 0, y: 1 }; e.preventDefault(); break;
        case 'ArrowLeft': case 'a': case 'A': if (d.x === 0) s.nextDir = { x: -1, y: 0 }; e.preventDefault(); break;
        case 'ArrowRight': case 'd': case 'D': if (d.x === 0) s.nextDir = { x: 1, y: 0 }; e.preventDefault(); break;
      }
    };
    window.addEventListener('keydown', onKey);
    draw();
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <GameShell title="サーキットスネーク" accent="#39ff14" onExit={onExit} onSwitchGame={onSwitchGame} currentId="snake"
      hud={<div className="flex flex-col items-end gap-0.5 font-mono text-xs"><span>スコア <span ref={scoreRef} className="text-neon-green">0</span></span><span>ベスト <span ref={bestRef} className="text-neon-yellow">0</span></span></div>}
      instructions="← → ↑ ↓ でヘビを操作 / エサを食べて長くしよう">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <canvas ref={canvasRef} width={W} height={H} className="rounded-lg border-2 border-neon-green/60 shadow-neonGreen" style={{ background: '#05060f' }} />
          <div ref={startRef} className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-lg bg-ink-900/85 backdrop-blur-sm">
            <p className="font-display text-2xl font-900 tracking-widest text-neon-green" style={{ textShadow: '0 0 12px #39ff14' }}>サーキットスネーク</p>
            <button onClick={reset} className="rounded-md border-2 border-neon-green bg-neon-green/10 px-8 py-3 font-display font-700 uppercase tracking-widest text-neon-green transition hover:bg-neon-green/20 active:scale-95">スタート</button>
          </div>
          <div ref={overRef} className="absolute inset-0 hidden flex-col items-center justify-center gap-4 rounded-lg bg-ink-900/85 backdrop-blur-sm">
            <p className="font-display text-2xl font-900 tracking-widest text-neon-red" style={{ textShadow: '0 0 12px #ff2d55' }}>ゲームオーバー</p>
            <button onClick={reset} className="rounded-md border-2 border-neon-green bg-neon-green/10 px-6 py-2 font-display font-700 uppercase tracking-widest text-neon-green transition hover:bg-neon-green/20 active:scale-95">リトライ</button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:hidden">
          <div />
          <button onTouchStart={() => { const s = state.current; if (s.dir.y === 0) s.nextDir = { x: 0, y: -1 }; }} className="rounded-md border border-neon-green/50 bg-neon-green/10 px-4 py-3 text-neon-green active:scale-90">↑</button>
          <div />
          <button onTouchStart={() => { const s = state.current; if (s.dir.x === 0) s.nextDir = { x: -1, y: 0 }; }} className="rounded-md border border-neon-green/50 bg-neon-green/10 px-4 py-3 text-neon-green active:scale-90">←</button>
          <button onTouchStart={() => { const s = state.current; if (s.dir.y === 0) s.nextDir = { x: 0, y: 1 }; }} className="rounded-md border border-neon-green/50 bg-neon-green/10 px-4 py-3 text-neon-green active:scale-90">↓</button>
          <button onTouchStart={() => { const s = state.current; if (s.dir.x === 0) s.nextDir = { x: 1, y: 0 }; }} className="rounded-md border border-neon-green/50 bg-neon-green/10 px-4 py-3 text-neon-green active:scale-90">→</button>
        </div>
      </div>
    </GameShell>
  );
}
