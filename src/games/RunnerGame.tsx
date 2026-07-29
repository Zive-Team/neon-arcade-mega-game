import { useEffect, useRef } from 'react';
import { GameShell } from '../components/GameShell';
import { useGameLoop } from '../hooks/useGameLoop';
import type { GameId } from '../types';

const W = 800;
const H = 360;
const GROUND = H - 50;
const GRAVITY = 0.7;
const JUMP = -13;
const SPEED_START = 5;

interface Obstacle { x: number; w: number; h: number; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; }

export function RunnerGame({ onExit, onSwitchGame }: { onExit: () => void; onSwitchGame: (id: GameId) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const overRef = useRef<HTMLDivElement>(null);
  const state = useRef({
    x: 100, y: GROUND, vy: 0, onGround: true, speed: SPEED_START,
    obstacles: [] as Obstacle[], spawnTimer: 0, spawnInterval: 1400,
    score: 0, over: false, bgOffset: 0, particles: [] as Particle[], doubleJump: false,
  });

  const jump = () => {
    const s = state.current; if (s.over) return;
    if (s.onGround) { s.vy = JUMP; s.onGround = false; s.doubleJump = true; }
    else if (s.doubleJump) { s.vy = JUMP * 0.85; s.doubleJump = false; spawnP(s, s.x, s.y, '#ff2bd6', 8); }
  };
  const spawnP = (s: typeof state.current, x: number, y: number, color: string, n: number) => {
    for (let i = 0; i < n; i++) s.particles.push({ x, y, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4 - 1, life: 30, color });
  };
  const reset = () => {
    state.current = { x: 100, y: GROUND, vy: 0, onGround: true, speed: SPEED_START, obstacles: [], spawnTimer: 0, spawnInterval: 1400, score: 0, over: false, bgOffset: 0, particles: [], doubleJump: false };
    if (overRef.current) overRef.current.style.display = 'none';
    if (scoreRef.current) scoreRef.current.textContent = '0';
  };

  const draw = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const s = state.current;
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0a0d1f'); grad.addColorStop(1, '#1a0a2e');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = 0; i < 30; i++) { const sx = (i * 73 - s.bgOffset * 0.2) % W; const sy = (i * 37) % (GROUND - 60); ctx.fillRect(((sx + W) % W), sy, 1.5, 1.5); }
    ctx.fillStyle = 'rgba(157,75,255,0.25)';
    for (let i = 0; i < 12; i++) { const bw = 60; const bh = 60 + ((i * 53) % 100); const bx = (i * 90 - s.bgOffset * 0.4) % (W + 90); ctx.fillRect(((bx + W) % W), GROUND - bh, bw, bh); }
    ctx.fillStyle = 'rgba(0,240,255,0.18)';
    for (let i = 0; i < 10; i++) { const bw = 80; const bh = 80 + ((i * 71) % 120); const bx = (i * 120 - s.bgOffset * 0.7) % (W + 120); const x = ((bx + W) % W); ctx.fillRect(x, GROUND - bh, bw, bh); ctx.fillStyle = 'rgba(255,242,0,0.4)'; for (let wy = 10; wy < bh - 10; wy += 18) for (let wx = 8; wx < bw - 8; wx += 16) { if ((i * 7 + wy + wx) % 3 === 0) ctx.fillRect(x + wx, GROUND - bh + wy, 6, 8); } ctx.fillStyle = 'rgba(0,240,255,0.18)'; }
    ctx.strokeStyle = '#00f0ff'; ctx.lineWidth = 2; ctx.shadowColor = '#00f0ff'; ctx.shadowBlur = 10; ctx.beginPath(); ctx.moveTo(0, GROUND); ctx.lineTo(W, GROUND); ctx.stroke(); ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(0,240,255,0.2)'; ctx.lineWidth = 1;
    for (let i = 0; i < 20; i++) { const lx = (i * 50 - s.bgOffset) % (W + 50); const x = ((lx + W) % W); ctx.beginPath(); ctx.moveTo(x, GROUND); ctx.lineTo(x - 100, H); ctx.stroke(); }
    for (const o of s.obstacles) { ctx.fillStyle = '#ff2bd6'; ctx.shadowColor = '#ff2bd6'; ctx.shadowBlur = 12; ctx.fillRect(o.x, GROUND - o.h, o.w, o.h); ctx.shadowBlur = 0; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(o.x, GROUND - o.h, o.w, o.h); }
    for (const p of s.particles) { ctx.globalAlpha = p.life / 30; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 3, 3); ctx.globalAlpha = 1; }
    const px = s.x, py = s.y;
    ctx.shadowColor = '#39ff14'; ctx.shadowBlur = 16; ctx.fillStyle = '#39ff14'; ctx.fillRect(px - 12, py - 28, 24, 28); ctx.shadowBlur = 0;
    ctx.fillStyle = '#00f0ff'; ctx.fillRect(px - 8, py - 24, 16, 6);
    ctx.fillStyle = '#39ff14';
    if (s.onGround) { const phase = Math.floor(s.bgOffset / 8) % 2; if (phase) { ctx.fillRect(px - 10, py - 6, 6, 6); ctx.fillRect(px + 4, py - 4, 6, 4); } else { ctx.fillRect(px - 10, py - 4, 6, 4); ctx.fillRect(px + 4, py - 6, 6, 6); } }
    else { ctx.fillRect(px - 10, py - 8, 6, 4); ctx.fillRect(px + 4, py - 8, 6, 4); }
  };

  useGameLoop((dt) => {
    const s = state.current; if (s.over) return;
    s.vy += GRAVITY; s.y += s.vy;
    if (s.y >= GROUND) { s.y = GROUND; s.vy = 0; if (!s.onGround) spawnP(s, s.x, GROUND, '#39ff14', 6); s.onGround = true; } else { s.onGround = false; }
    s.bgOffset += s.speed; s.score += Math.floor(s.speed * dt * 0.01);
    if (scoreRef.current) scoreRef.current.textContent = String(s.score);
    s.spawnTimer += dt;
    if (s.spawnTimer >= s.spawnInterval) { s.spawnTimer = 0; const h = 24 + Math.floor(Math.random() * 36); const w = 18 + Math.floor(Math.random() * 14); s.obstacles.push({ x: W + 20, w, h }); s.spawnInterval = Math.max(700, 1400 - s.score * 2); }
    for (const o of s.obstacles) o.x -= s.speed;
    s.obstacles = s.obstacles.filter((o) => o.x + o.w > -20);
    for (const o of s.obstacles) { if (s.x - 12 < o.x + o.w && s.x + 12 > o.x && s.y > GROUND - o.h) { s.over = true; spawnP(s, s.x, s.y - 14, '#ff2d55', 20); if (overRef.current) overRef.current.style.display = 'flex'; } }
    s.speed = Math.min(12, SPEED_START + s.score * 0.003);
    for (const p of s.particles) { p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life -= 1; }
    s.particles = s.particles.filter((p) => p.life > 0);
    draw();
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { jump(); e.preventDefault(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <GameShell title="ネオンダッシュ" accent="#ff2bd6" onExit={onExit} onSwitchGame={onSwitchGame} currentId="runner"
      hud={<span>スコア <span ref={scoreRef} className="text-neon-magenta">0</span></span>}
      instructions="スペース / ↑ / クリック でジャンプ（2段階まで）">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-full" style={{ maxWidth: W }}>
          <canvas ref={canvasRef} width={W} height={H} className="w-full rounded-lg border-2 border-neon-magenta/60 shadow-neonMagenta" style={{ background: '#0a0d1f' }} onClick={jump} onTouchStart={(e) => { e.preventDefault(); jump(); }} />
          <div ref={overRef} className="absolute inset-0 hidden flex-col items-center justify-center gap-4 rounded-lg bg-ink-900/85 backdrop-blur-sm">
            <p className="font-display text-2xl font-900 tracking-widest text-neon-red" style={{ textShadow: '0 0 12px #ff2d55' }}>ゲームオーバー</p>
            <button onClick={reset} className="rounded-md border-2 border-neon-magenta bg-neon-magenta/10 px-6 py-2 font-display font-700 uppercase tracking-widest text-neon-magenta transition hover:bg-neon-magenta/20 active:scale-95">リトライ</button>
          </div>
        </div>
        <button onClick={jump} className="rounded-md border border-neon-magenta/50 bg-neon-magenta/10 px-8 py-3 font-display font-700 uppercase tracking-widest text-neon-magenta transition hover:bg-neon-magenta/20 active:scale-95 sm:hidden">ジャンプ</button>
      </div>
    </GameShell>
  );
}
