import { useEffect, useRef } from 'react';
import { GameShell } from '../components/GameShell';
import { useGameLoop } from '../hooks/useGameLoop';
import type { GameId } from '../types';

const W = 800;
const H = 480;

interface Bullet { x: number; y: number; vy: number; }
interface Asteroid { x: number; y: number; r: number; vx: number; vy: number; hp: number; rot: number; vr: number; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; }
interface Star { x: number; y: number; z: number; }

export function ShooterGame({ onExit, onSwitchGame }: { onExit: () => void; onSwitchGame: (id: GameId) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const livesRef = useRef<HTMLSpanElement>(null);
  const overRef = useRef<HTMLDivElement>(null);
  const state = useRef({
    px: W / 2, py: H - 60, bullets: [] as Bullet[], asteroids: [] as Asteroid[], particles: [] as Particle[],
    stars: Array.from({ length: 80 }, () => ({ x: Math.random() * W, y: Math.random() * H, z: Math.random() * 2 + 0.3 })) as Star[],
    score: 0, lives: 3, over: false, cooldown: 0, spawnTimer: 0, spawnInterval: 900, keys: {} as Record<string, boolean>, invuln: 0,
  });

  const fire = () => { const s = state.current; if (s.over || s.cooldown > 0) return; s.bullets.push({ x: s.px, y: s.py - 20, vy: -10 }); s.cooldown = 180; };
  const reset = () => {
    state.current = { px: W / 2, py: H - 60, bullets: [], asteroids: [], particles: [], stars: Array.from({ length: 80 }, () => ({ x: Math.random() * W, y: Math.random() * H, z: Math.random() * 2 + 0.3 })), score: 0, lives: 3, over: false, cooldown: 0, spawnTimer: 0, spawnInterval: 900, keys: {}, invuln: 0 };
    if (overRef.current) overRef.current.style.display = 'none';
    if (scoreRef.current) scoreRef.current.textContent = '0';
    if (livesRef.current) livesRef.current.textContent = '♥♥♥';
  };
  const explode = (x: number, y: number, color: string, n: number) => { const s = state.current; for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2; const sp = Math.random() * 4 + 1; s.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 30 + Math.random() * 20, color }); } };

  const draw = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const s = state.current;
    ctx.fillStyle = '#05060f'; ctx.fillRect(0, 0, W, H);
    for (const st of s.stars) { ctx.globalAlpha = st.z / 2.3; ctx.fillStyle = '#ffffff'; ctx.fillRect(st.x, st.y, st.z, st.z); }
    ctx.globalAlpha = 1;
    for (const a of s.asteroids) {
      ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.rot);
      ctx.strokeStyle = '#ff7a00'; ctx.lineWidth = 2; ctx.shadowColor = '#ff7a00'; ctx.shadowBlur = 10;
      ctx.beginPath(); const sides = 7;
      for (let i = 0; i <= sides; i++) { const ang = (i / sides) * Math.PI * 2; const rr = a.r * (0.8 + ((i * 13) % 5) / 10); const px = Math.cos(ang) * rr; const py = Math.sin(ang) * rr; if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
      ctx.closePath(); ctx.stroke(); ctx.fillStyle = 'rgba(255,122,0,0.12)'; ctx.fill(); ctx.restore(); ctx.shadowBlur = 0;
    }
    ctx.fillStyle = '#39ff14'; ctx.shadowColor = '#39ff14'; ctx.shadowBlur = 8;
    for (const b of s.bullets) ctx.fillRect(b.x - 2, b.y - 8, 4, 16);
    ctx.shadowBlur = 0;
    for (const p of s.particles) { ctx.globalAlpha = Math.min(1, p.life / 30); ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 3, 3); }
    ctx.globalAlpha = 1;
    if (!s.over && (s.invuln <= 0 || Math.floor(s.invuln / 80) % 2 === 0)) {
      ctx.save(); ctx.translate(s.px, s.py); ctx.shadowColor = '#00f0ff'; ctx.shadowBlur = 14; ctx.fillStyle = '#00f0ff';
      ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(-14, 14); ctx.lineTo(-6, 8); ctx.lineTo(6, 8); ctx.lineTo(14, 14); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#ff2bd6'; ctx.beginPath(); ctx.arc(0, -6, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff200'; ctx.fillRect(-4, 8, 8, 4 + Math.random() * 4); ctx.restore(); ctx.shadowBlur = 0;
    }
  };

  useGameLoop((dt) => {
    const s = state.current; if (s.over) return;
    const sp = 6;
    if (s.keys['ArrowLeft'] || s.keys['a']) s.px -= sp;
    if (s.keys['ArrowRight'] || s.keys['d']) s.px += sp;
    if (s.keys['ArrowUp'] || s.keys['w']) s.py -= sp;
    if (s.keys['ArrowDown'] || s.keys['s']) s.py += sp;
    s.px = Math.max(16, Math.min(W - 16, s.px)); s.py = Math.max(20, Math.min(H - 20, s.py));
    s.cooldown = Math.max(0, s.cooldown - dt);
    if (s.keys[' ']) fire();
    for (const b of s.bullets) b.y += b.vy;
    s.bullets = s.bullets.filter((b) => b.y > -20);
    s.spawnTimer += dt;
    if (s.spawnTimer >= s.spawnInterval) { s.spawnTimer = 0; const r = 16 + Math.random() * 24; s.asteroids.push({ x: Math.random() * (W - 60) + 30, y: -r, r, vx: (Math.random() - 0.5) * 2, vy: 1.5 + Math.random() * 2 + s.score * 0.002, hp: Math.ceil(r / 16), rot: 0, vr: (Math.random() - 0.5) * 0.05 }); s.spawnInterval = Math.max(400, 900 - s.score * 1.5); }
    for (const a of s.asteroids) { a.x += a.vx; a.y += a.vy; a.rot += a.vr; }
    for (const b of s.bullets) for (const a of s.asteroids) { const dx = b.x - a.x; const dy = b.y - a.y; if (dx * dx + dy * dy < a.r * a.r) { a.hp -= 1; b.y = -999; if (a.hp <= 0) { a.y = 9999; s.score += Math.floor(a.r); if (scoreRef.current) scoreRef.current.textContent = String(s.score); explode(a.x, a.y, '#ff7a00', 12); if (a.r > 28) for (let i = 0; i < 2; i++) s.asteroids.push({ x: a.x, y: a.y, r: a.r / 2, vx: (Math.random() - 0.5) * 4, vy: 1 + Math.random() * 2, hp: 1, rot: 0, vr: (Math.random() - 0.5) * 0.08 }); } else explode(b.x, b.y, '#fff200', 4); } }
    s.bullets = s.bullets.filter((b) => b.y > -20);
    s.asteroids = s.asteroids.filter((a) => a.y < H + 60 && a.y < 9000);
    if (s.invuln > 0) s.invuln -= dt;
    if (s.invuln <= 0) for (const a of s.asteroids) { const dx = s.px - a.x; const dy = s.py - a.y; if (dx * dx + dy * dy < (a.r + 12) * (a.r + 12)) { s.lives -= 1; s.invuln = 1500; explode(s.px, s.py, '#ff2d55', 16); a.y = 9999; if (livesRef.current) livesRef.current.textContent = '♥'.repeat(Math.max(0, s.lives)) || '—'; if (s.lives <= 0) { s.over = true; if (overRef.current) overRef.current.style.display = 'flex'; } break; } }
    for (const st of s.stars) { st.y += st.z * 1.5; if (st.y > H) { st.y = 0; st.x = Math.random() * W; } }
    for (const p of s.particles) { p.x += p.vx; p.y += p.vy; p.life -= 1; }
    s.particles = s.particles.filter((p) => p.life > 0);
    draw();
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => { state.current.keys[e.key] = true; if (e.key === ' ') e.preventDefault(); };
    const up = (e: KeyboardEvent) => { state.current.keys[e.key] = false; };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  return (
    <GameShell title="スターバースト" accent="#39ff14" onExit={onExit} onSwitchGame={onSwitchGame} currentId="shooter"
      hud={<div className="flex flex-col items-end gap-0.5 font-mono text-xs"><span>スコア <span ref={scoreRef} className="text-neon-green">0</span></span><span>残機 <span ref={livesRef} className="text-neon-red">♥♥♥</span></span></div>}
      instructions="← → ↑ ↓ で移動 / スペース で発射（長押し可）">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-full" style={{ maxWidth: W }}>
          <canvas ref={canvasRef} width={W} height={H} className="w-full rounded-lg border-2 border-neon-green/60 shadow-neonGreen" style={{ background: '#05060f' }} />
          <div ref={overRef} className="absolute inset-0 hidden flex-col items-center justify-center gap-4 rounded-lg bg-ink-900/85 backdrop-blur-sm">
            <p className="font-display text-2xl font-900 tracking-widest text-neon-red" style={{ textShadow: '0 0 12px #ff2d55' }}>ゲームオーバー</p>
            <button onClick={reset} className="rounded-md border-2 border-neon-green bg-neon-green/10 px-6 py-2 font-display font-700 uppercase tracking-widest text-neon-green transition hover:bg-neon-green/20 active:scale-95">リトライ</button>
          </div>
        </div>
      </div>
    </GameShell>
  );
}
