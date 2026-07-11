import { useEffect, useRef } from 'react';
import { GameShell } from '../components/GameShell';
import { useGameLoop } from '../hooks/useGameLoop';
import type { GameId } from '../types';

const W = 600;
const H = 480;
const PADDLE_W = 90;
const PADDLE_H = 12;
const BALL_R = 7;
const BRICK_ROWS = 5;
const BRICK_COLS = 10;
const BRICK_H = 18;
const BRICK_GAP = 4;
const BRICK_TOP = 50;
const BRICK_W = (W - (BRICK_COLS + 1) * BRICK_GAP) / BRICK_COLS;
const BRICK_COLORS = ['#ff2d55', '#ff7a00', '#fff200', '#39ff14', '#00f0ff'];

interface Brick { x: number; y: number; alive: boolean; color: string; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; }

function makeBricks(): Brick[] {
  const bricks: Brick[] = [];
  for (let r = 0; r < BRICK_ROWS; r++) for (let c = 0; c < BRICK_COLS; c++) bricks.push({ x: BRICK_GAP + c * (BRICK_W + BRICK_GAP), y: BRICK_TOP + r * (BRICK_H + BRICK_GAP), alive: true, color: BRICK_COLORS[r] });
  return bricks;
}

export function BreakoutGame({ onExit, onSwitchGame }: { onExit: () => void; onSwitchGame: (id: GameId) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const livesRef = useRef<HTMLSpanElement>(null);
  const overRef = useRef<HTMLDivElement>(null);
  const winRef = useRef<HTMLDivElement>(null);
  const state = useRef({
    px: W / 2 - PADDLE_W / 2, bx: W / 2, by: H - 80, bvx: 3, bvy: -3, launched: false,
    bricks: makeBricks(), score: 0, lives: 3, over: false, won: false, particles: [] as Particle[], keys: {} as Record<string, boolean>, mouseX: -1,
  });

  const reset = () => {
    state.current = { px: W / 2 - PADDLE_W / 2, bx: W / 2, by: H - 80, bvx: 3, bvy: -3, launched: false, bricks: makeBricks(), score: 0, lives: 3, over: false, won: false, particles: [], keys: {}, mouseX: -1 };
    if (overRef.current) overRef.current.style.display = 'none';
    if (winRef.current) winRef.current.style.display = 'none';
    if (scoreRef.current) scoreRef.current.textContent = '0';
    if (livesRef.current) livesRef.current.textContent = '♥♥♥';
  };
  const launch = () => { const s = state.current; if (!s.launched && !s.over && !s.won) s.launched = true; };
  const explode = (x: number, y: number, color: string) => { const s = state.current; for (let i = 0; i < 8; i++) { const a = Math.random() * Math.PI * 2; const sp = Math.random() * 3 + 1; s.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 25, color }); } };

  const draw = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const s = state.current;
    ctx.fillStyle = '#05060f'; ctx.fillRect(0, 0, W, H);
    for (const b of s.bricks) if (b.alive) { ctx.fillStyle = b.color; ctx.shadowColor = b.color; ctx.shadowBlur = 6; ctx.fillRect(b.x, b.y, BRICK_W, BRICK_H); ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1; ctx.strokeRect(b.x, b.y, BRICK_W, BRICK_H); }
    ctx.fillStyle = '#00f0ff'; ctx.shadowColor = '#00f0ff'; ctx.shadowBlur = 12; ctx.fillRect(s.px, H - PADDLE_H - 4, PADDLE_W, PADDLE_H); ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.arc(s.bx, s.by, BALL_R, 0, Math.PI * 2); ctx.fillStyle = '#fff200'; ctx.shadowColor = '#fff200'; ctx.shadowBlur = 14; ctx.fill(); ctx.shadowBlur = 0;
    for (const p of s.particles) { ctx.globalAlpha = p.life / 25; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 3, 3); ctx.globalAlpha = 1; }
    if (!s.launched && !s.over && !s.won) { ctx.fillStyle = 'rgba(0,240,255,0.7)'; ctx.font = '14px "Share Tech Mono", monospace'; ctx.textAlign = 'center'; ctx.fillText('クリック or スペースで発射', W / 2, H / 2); }
  };

  useGameLoop(() => {
    const s = state.current; if (s.over || s.won) return;
    const sp = 7;
    if (s.keys['ArrowLeft'] || s.keys['a']) s.px -= sp;
    if (s.keys['ArrowRight'] || s.keys['d']) s.px += sp;
    if (s.mouseX >= 0) s.px = s.mouseX - PADDLE_W / 2;
    s.px = Math.max(0, Math.min(W - PADDLE_W, s.px));
    if (!s.launched) { s.bx = s.px + PADDLE_W / 2; s.by = H - PADDLE_H - 4 - BALL_R; draw(); return; }
    s.bx += s.bvx; s.by += s.bvy;
    if (s.bx < BALL_R) { s.bx = BALL_R; s.bvx = Math.abs(s.bvx); }
    if (s.bx > W - BALL_R) { s.bx = W - BALL_R; s.bvx = -Math.abs(s.bvx); }
    if (s.by < BALL_R) { s.by = BALL_R; s.bvy = Math.abs(s.bvy); }
    if (s.by > H - PADDLE_H - 4 - BALL_R && s.by < H - 4 && s.bvy > 0 && s.bx > s.px && s.bx < s.px + PADDLE_W) { s.by = H - PADDLE_H - 4 - BALL_R; const hit = (s.bx - s.px) / PADDLE_W - 0.5; s.bvx = hit * 7; s.bvy = -Math.abs(s.bvy) * 1.02; const sp2 = Math.hypot(s.bvx, s.bvy); const max = 9; if (sp2 > max) { s.bvx = (s.bvx / sp2) * max; s.bvy = (s.bvy / sp2) * max; } }
    if (s.by > H + 20) { s.lives -= 1; if (livesRef.current) livesRef.current.textContent = '♥'.repeat(Math.max(0, s.lives)) || '—'; if (s.lives <= 0) { s.over = true; if (overRef.current) overRef.current.style.display = 'flex'; } else { s.launched = false; s.bvx = 3; s.bvy = -3; } }
    for (const b of s.bricks) { if (!b.alive) continue; if (s.bx + BALL_R > b.x && s.bx - BALL_R < b.x + BRICK_W && s.by + BALL_R > b.y && s.by - BALL_R < b.y + BRICK_H) { b.alive = false; s.score += 10; if (scoreRef.current) scoreRef.current.textContent = String(s.score); explode(b.x + BRICK_W / 2, b.y + BRICK_H / 2, b.color); const overlapL = (s.bx + BALL_R) - b.x; const overlapR = (b.x + BRICK_W) - (s.bx - BALL_R); const overlapT = (s.by + BALL_R) - b.y; const overlapB = (b.y + BRICK_H) - (s.by - BALL_R); const minH = Math.min(overlapL, overlapR); const minV = Math.min(overlapT, overlapB); if (minH < minV) s.bvx = -s.bvx; else s.bvy = -s.bvy; break; } }
    if (s.bricks.every((b) => !b.alive)) { s.won = true; if (winRef.current) winRef.current.style.display = 'flex'; }
    for (const p of s.particles) { p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life -= 1; }
    s.particles = s.particles.filter((p) => p.life > 0);
    draw();
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => { state.current.keys[e.key] = true; if (e.key === ' ') { launch(); e.preventDefault(); } };
    const up = (e: KeyboardEvent) => { state.current.keys[e.key] = false; };
    const move = (e: MouseEvent) => { const canvas = canvasRef.current; if (!canvas) return; const rect = canvas.getBoundingClientRect(); state.current.mouseX = ((e.clientX - rect.left) / rect.width) * W; };
    const touchMove = (e: TouchEvent) => { const canvas = canvasRef.current; if (!canvas) return; const rect = canvas.getBoundingClientRect(); state.current.mouseX = ((e.touches[0].clientX - rect.left) / rect.width) * W; e.preventDefault(); };
    const click = () => launch();
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    const canvas = canvasRef.current; if (canvas) { canvas.addEventListener('mousemove', move); canvas.addEventListener('touchmove', touchMove); canvas.addEventListener('click', click); canvas.addEventListener('touchstart', click); }
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); if (canvas) { canvas.removeEventListener('mousemove', move); canvas.removeEventListener('touchmove', touchMove); canvas.removeEventListener('click', click); canvas.removeEventListener('touchstart', click); } };
  }, []);

  return (
    <GameShell title="ブリックブレイカー" accent="#2d7dff" onExit={onExit} onSwitchGame={onSwitchGame} currentId="breakout"
      hud={<div className="flex flex-col items-end gap-0.5 font-mono text-xs"><span>スコア <span ref={scoreRef} className="text-neon-blue">0</span></span><span>残機 <span ref={livesRef} className="text-neon-red">♥♥♥</span></span></div>}
      instructions="← → / マウス でパドル移動 / スペース or クリック でボール発射">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-full" style={{ maxWidth: W }}>
          <canvas ref={canvasRef} width={W} height={H} className="w-full rounded-lg border-2 border-neon-blue/60" style={{ background: '#05060f', boxShadow: '0 0 16px rgba(45,125,255,0.4)' }} />
          <div ref={overRef} className="absolute inset-0 hidden flex-col items-center justify-center gap-4 rounded-lg bg-ink-900/85 backdrop-blur-sm">
            <p className="font-display text-2xl font-900 tracking-widest text-neon-red" style={{ textShadow: '0 0 12px #ff2d55' }}>ゲームオーバー</p>
            <button onClick={reset} className="rounded-md border-2 border-neon-blue bg-neon-blue/10 px-6 py-2 font-display font-700 uppercase tracking-widest text-neon-blue transition hover:bg-neon-blue/20 active:scale-95">リトライ</button>
          </div>
          <div ref={winRef} className="absolute inset-0 hidden flex-col items-center justify-center gap-4 rounded-lg bg-ink-900/85 backdrop-blur-sm">
            <p className="font-display text-2xl font-900 tracking-widest text-neon-green" style={{ textShadow: '0 0 12px #39ff14' }}>クリア!</p>
            <button onClick={reset} className="rounded-md border-2 border-neon-green bg-neon-green/10 px-6 py-2 font-display font-700 uppercase tracking-widest text-neon-green transition hover:bg-neon-green/20 active:scale-95">もう一度</button>
          </div>
        </div>
      </div>
    </GameShell>
  );
}
