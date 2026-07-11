import { useEffect, useRef } from 'react';
import { GameShell } from '../components/GameShell';
import { useGameLoop } from '../hooks/useGameLoop';
import type { GameId } from '../types';

const COLS = 10;
const ROWS = 20;
const CELL = 30;
const COLORS = ['#00f0ff', '#ff2bd6', '#39ff14', '#fff200', '#9d4bff', '#ff7a00', '#2d7dff'];
const SHAPES: number[][][] = [
  [[1, 1, 1, 1]], [[1, 1], [1, 1]], [[0, 1, 0], [1, 1, 1]], [[0, 1, 1], [1, 1, 0]],
  [[1, 1, 0], [0, 1, 1]], [[1, 0, 0], [1, 1, 1]], [[0, 0, 1], [1, 1, 1]],
];

interface Piece { shape: number[][]; x: number; y: number; color: string; }

function newPiece(): Piece {
  const idx = Math.floor(Math.random() * SHAPES.length);
  return { shape: SHAPES[idx].map((r) => [...r]), x: Math.floor(COLS / 2) - 1, y: 0, color: COLORS[idx] };
}
function emptyGrid(): (string | null)[][] { return Array.from({ length: ROWS }, () => Array<string | null>(COLS).fill(null)); }
function rotate(shape: number[][]): number[][] {
  const rows = shape.length, cols = shape[0].length;
  const out = Array.from({ length: cols }, () => Array<number>(rows).fill(0));
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out[c][rows - 1 - r] = shape[r][c];
  return out;
}
function collide(grid: (string | null)[][], p: Piece): boolean {
  for (let r = 0; r < p.shape.length; r++) for (let c = 0; c < p.shape[r].length; c++) {
    if (!p.shape[r][c]) continue;
    const gx = p.x + c, gy = p.y + r;
    if (gx < 0 || gx >= COLS || gy >= ROWS) return true;
    if (gy >= 0 && grid[gy][gx]) return true;
  }
  return false;
}
function merge(grid: (string | null)[][], p: Piece): (string | null)[][] {
  const g = grid.map((r) => [...r]);
  for (let r = 0; r < p.shape.length; r++) for (let c = 0; c < p.shape[r].length; c++) if (p.shape[r][c] && p.y + r >= 0) g[p.y + r][p.x + c] = p.color;
  return g;
}
function clearLines(grid: (string | null)[][]): { grid: (string | null)[][]; cleared: number } {
  const g = grid.filter((row) => row.some((c) => c === null));
  const cleared = ROWS - g.length;
  while (g.length < ROWS) g.unshift(Array<string | null>(COLS).fill(null));
  return { grid: g, cleared };
}

export function TetrisGame({ onExit, onSwitchGame }: { onExit: () => void; onSwitchGame: (id: GameId) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const linesRef = useRef<HTMLSpanElement>(null);
  const levelRef = useRef<HTMLSpanElement>(null);
  const overRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({
    grid: emptyGrid(), piece: newPiece(), next: newPiece(), score: 0, lines: 0, level: 1,
    dropAcc: 0, dropInterval: 800, over: false, paused: false,
  });

  const drawCell = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
    ctx.fillStyle = color; ctx.fillRect(x + 2, y + 2, CELL - 4, CELL - 4);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(x + 2, y + 2, CELL - 4, CELL - 4);
    ctx.shadowColor = color; ctx.shadowBlur = 8; ctx.strokeRect(x + 2, y + 2, CELL - 4, CELL - 4); ctx.shadowBlur = 0;
  };

  const draw = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const s = stateRef.current;
    const W = COLS * CELL, H = ROWS * CELL;
    ctx.fillStyle = '#05060f'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(0,240,255,0.08)'; ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, H); ctx.stroke(); }
    for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(W, y * CELL); ctx.stroke(); }
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const color = s.grid[r][c]; if (color) drawCell(ctx, c * CELL, r * CELL, color); }
    const ghost = { ...s.piece, y: s.piece.y };
    while (!collide(s.grid, { ...ghost, y: ghost.y + 1 })) ghost.y++;
    for (let r = 0; r < ghost.shape.length; r++) for (let c = 0; c < ghost.shape[r].length; c++) if (ghost.shape[r][c]) { ctx.globalAlpha = 0.18; drawCell(ctx, (ghost.x + c) * CELL, (ghost.y + r) * CELL, ghost.color); ctx.globalAlpha = 1; }
    for (let r = 0; r < s.piece.shape.length; r++) for (let c = 0; c < s.piece.shape[r].length; c++) if (s.piece.shape[r][c]) drawCell(ctx, (s.piece.x + c) * CELL, (s.piece.y + r) * CELL, s.piece.color);
  };

  const spawn = () => {
    const s = stateRef.current; s.piece = s.next; s.next = newPiece();
    if (collide(s.grid, s.piece)) { s.over = true; if (overRef.current) overRef.current.style.display = 'flex'; }
  };
  const lockAndSpawn = () => {
    const s = stateRef.current; s.grid = merge(s.grid, s.piece);
    const { grid, cleared } = clearLines(s.grid); s.grid = grid;
    if (cleared > 0) {
      s.lines += cleared; s.score += [0, 100, 300, 500, 800][cleared] * s.level;
      s.level = Math.floor(s.lines / 10) + 1; s.dropInterval = Math.max(80, 800 - (s.level - 1) * 70);
      if (scoreRef.current) scoreRef.current.textContent = String(s.score);
      if (linesRef.current) linesRef.current.textContent = String(s.lines);
      if (levelRef.current) levelRef.current.textContent = String(s.level);
    }
    spawn();
  };
  const move = (dx: number) => { const s = stateRef.current; if (s.over || s.paused) return; const np = { ...s.piece, x: s.piece.x + dx }; if (!collide(s.grid, np)) s.piece = np; };
  const tryRotate = () => { const s = stateRef.current; if (s.over || s.paused) return; const rotated = rotate(s.piece.shape); for (const k of [0, -1, 1, -2, 2]) { const np = { ...s.piece, shape: rotated, x: s.piece.x + k }; if (!collide(s.grid, np)) { s.piece = np; return; } } };
  const softDrop = () => { const s = stateRef.current; if (s.over || s.paused) return; const np = { ...s.piece, y: s.piece.y + 1 }; if (collide(s.grid, np)) lockAndSpawn(); else { s.piece = np; s.score += 1; if (scoreRef.current) scoreRef.current.textContent = String(s.score); } };
  const hardDrop = () => { const s = stateRef.current; if (s.over || s.paused) return; while (!collide(s.grid, { ...s.piece, y: s.piece.y + 1 })) { s.piece = { ...s.piece, y: s.piece.y + 1 }; s.score += 2; } if (scoreRef.current) scoreRef.current.textContent = String(s.score); lockAndSpawn(); };
  const togglePause = () => { const s = stateRef.current; if (s.over) return; s.paused = !s.paused; };
  const reset = () => {
    stateRef.current = { grid: emptyGrid(), piece: newPiece(), next: newPiece(), score: 0, lines: 0, level: 1, dropAcc: 0, dropInterval: 800, over: false, paused: false };
    if (scoreRef.current) scoreRef.current.textContent = '0';
    if (linesRef.current) linesRef.current.textContent = '0';
    if (levelRef.current) levelRef.current.textContent = '1';
    if (overRef.current) overRef.current.style.display = 'none';
  };

  useGameLoop((dt) => {
    const s = stateRef.current; if (s.over || s.paused) return;
    s.dropAcc += dt;
    if (s.dropAcc >= s.dropInterval) { s.dropAcc = 0; const np = { ...s.piece, y: s.piece.y + 1 }; if (collide(s.grid, np)) lockAndSpawn(); else s.piece = np; }
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft': move(-1); e.preventDefault(); break;
        case 'ArrowRight': move(1); e.preventDefault(); break;
        case 'ArrowDown': softDrop(); e.preventDefault(); break;
        case 'ArrowUp': tryRotate(); e.preventDefault(); break;
        case ' ': hardDrop(); e.preventDefault(); break;
        case 'p': case 'P': togglePause(); break;
      }
      draw();
    };
    window.addEventListener('keydown', onKey);
    draw();
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <GameShell title="ブロックフォール" accent="#00f0ff" onExit={onExit} onSwitchGame={onSwitchGame} currentId="tetris"
      hud={<div className="flex flex-col items-end gap-0.5 font-mono text-xs"><span>スコア <span ref={scoreRef} className="text-neon-cyan">0</span></span><span>消去 <span ref={linesRef} className="text-neon-green">0</span></span><span>レベル <span ref={levelRef} className="text-neon-magenta">1</span></span></div>}
      instructions="← → 移動 / ↑ 回転 / ↓ 落下 / スペース 一気落下 / P 一時停止">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <canvas ref={canvasRef} width={COLS * CELL} height={ROWS * CELL} className="rounded-lg border-2 border-neon-cyan/60 shadow-neonCyan" style={{ background: '#05060f' }} />
          <div ref={overRef} className="absolute inset-0 hidden flex-col items-center justify-center gap-4 rounded-lg bg-ink-900/85 backdrop-blur-sm">
            <p className="font-display text-2xl font-900 tracking-widest text-neon-red" style={{ textShadow: '0 0 12px #ff2d55' }}>ゲームオーバー</p>
            <button onClick={reset} className="rounded-md border-2 border-neon-cyan bg-neon-cyan/10 px-6 py-2 font-display font-700 uppercase tracking-widest text-neon-cyan transition hover:bg-neon-cyan/20 active:scale-95">リトライ</button>
          </div>
        </div>
        <div className="flex gap-3 sm:hidden">
          <button onClick={() => { move(-1); draw(); }} className="rounded-md border border-neon-cyan/50 bg-neon-cyan/10 px-4 py-3 font-mono text-sm text-neon-cyan active:scale-90">←</button>
          <button onClick={() => { move(1); draw(); }} className="rounded-md border border-neon-cyan/50 bg-neon-cyan/10 px-4 py-3 font-mono text-sm text-neon-cyan active:scale-90">→</button>
          <button onClick={() => { tryRotate(); draw(); }} className="rounded-md border border-neon-cyan/50 bg-neon-cyan/10 px-4 py-3 font-mono text-sm text-neon-cyan active:scale-90">回転</button>
          <button onClick={() => { softDrop(); draw(); }} className="rounded-md border border-neon-cyan/50 bg-neon-cyan/10 px-4 py-3 font-mono text-sm text-neon-cyan active:scale-90">↓</button>
          <button onClick={() => { hardDrop(); draw(); }} className="rounded-md border border-neon-cyan/50 bg-neon-cyan/10 px-4 py-3 font-mono text-sm text-neon-cyan active:scale-90">落下</button>
        </div>
      </div>
    </GameShell>
  );
}
