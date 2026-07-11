import { useEffect, useRef, useState } from 'react';
import { GameShell } from '../components/GameShell';
import { useGameLoop } from '../hooks/useGameLoop';
import type { GameId } from '../types';

const W = 500;
const H = 600;
const LANES = 4;
const LANE_W = W / LANES;
const HIT_LINE = H - 100;
const NOTE_H = 24;
const NOTE_SPEED = 0.35;
const HIT_WINDOW = 45;
const GAME_TIME = 60;

const LANE_COLORS = ['#00f0ff', '#ff2bd6', '#39ff14', '#fff200'];
const LANE_KEYS = ['d', 'f', 'j', 'k'];

interface Note { lane: number; y: number; hit: boolean; missed: boolean; id: number; }
interface Particle { x: number; y: number; life: number; color: string; }

function generateChart(): { time: number; lane: number }[] {
  const notes: { time: number; lane: number }[] = [];
  let t = 2000;
  while (t < GAME_TIME * 1000) {
    const burst = Math.random() < 0.3 ? 2 : 1;
    const used = new Set<number>();
    for (let i = 0; i < burst; i++) {
      let lane = Math.floor(Math.random() * LANES);
      while (used.has(lane)) lane = Math.floor(Math.random() * LANES);
      used.add(lane);
      notes.push({ time: t, lane });
    }
    t += 500 + Math.random() * 400;
  }
  return notes;
}

export function RhythmGame({ onExit, onSwitchGame }: { onExit: () => void; onSwitchGame: (id: GameId) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const comboRef = useRef<HTMLSpanElement>(null);
  const accRef = useRef<HTMLSpanElement>(null);
  const overRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const state = useRef({
    notes: [] as Note[], chart: generateChart(), chartIdx: 0, elapsed: 0,
    score: 0, combo: 0, maxCombo: 0, hits: 0, total: 0, particles: [] as Particle[],
    laneFlash: [0, 0, 0, 0], keys: {} as Record<string, boolean>, over: false,
  });
  const noteId = useRef(0);

  const start = () => {
    const s = state.current;
    s.notes = []; s.chart = generateChart(); s.chartIdx = 0; s.elapsed = 0; s.score = 0; s.combo = 0; s.maxCombo = 0; s.hits = 0; s.total = 0; s.particles = []; s.laneFlash = [0, 0, 0, 0]; s.over = false;
    setStarted(true);
    if (overRef.current) overRef.current.style.display = 'none';
    if (scoreRef.current) scoreRef.current.textContent = '0';
    if (comboRef.current) comboRef.current.textContent = '0';
    if (accRef.current) accRef.current.textContent = '—';
  };

  const tryHit = (lane: number) => {
    const s = state.current; if (s.over) return;
    s.laneFlash[lane] = 200;
    let best: Note | null = null; let bestDist = Infinity;
    for (const n of s.notes) {
      if (n.lane !== lane || n.hit || n.missed) continue;
      const dist = Math.abs(n.y - HIT_LINE);
      if (dist < HIT_WINDOW && dist < bestDist) { best = n; bestDist = dist; }
    }
    if (best) {
      best.hit = true; s.combo++; s.maxCombo = Math.max(s.maxCombo, s.combo); s.hits++; s.total++;
      const rating = bestDist < 15 ? 300 : bestDist < 30 ? 200 : 100;
      s.score += rating + s.combo * 2;
      s.particles.push({ x: lane * LANE_W + LANE_W / 2, y: HIT_LINE, life: 30, color: LANE_COLORS[lane] });
      if (scoreRef.current) scoreRef.current.textContent = String(s.score);
      if (comboRef.current) comboRef.current.textContent = String(s.combo);
      if (accRef.current) accRef.current.textContent = `${Math.round((s.hits / s.total) * 100)}%`;
    }
  };

  const draw = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const s = state.current;
    ctx.fillStyle = '#05060f'; ctx.fillRect(0, 0, W, H);
    for (let l = 0; l < LANES; l++) {
      ctx.fillStyle = l % 2 === 0 ? 'rgba(0,240,255,0.03)' : 'rgba(255,43,214,0.03)';
      ctx.fillRect(l * LANE_W, 0, LANE_W, H);
      if (s.laneFlash[l] > 0) { ctx.globalAlpha = s.laneFlash[l] / 400; ctx.fillStyle = LANE_COLORS[l]; ctx.fillRect(l * LANE_W, 0, LANE_W, H); ctx.globalAlpha = 1; }
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(l * LANE_W, 0); ctx.lineTo(l * LANE_W, H); ctx.stroke();
    }
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.shadowColor = '#fff'; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.moveTo(0, HIT_LINE); ctx.lineTo(W, HIT_LINE); ctx.stroke(); ctx.shadowBlur = 0;
    for (let l = 0; l < LANES; l++) {
      ctx.fillStyle = `${LANE_COLORS[l]}33`; ctx.fillRect(l * LANE_W + 4, HIT_LINE - 4, LANE_W - 8, 8);
      ctx.fillStyle = LANE_COLORS[l]; ctx.font = 'bold 16px "Share Tech Mono", monospace'; ctx.textAlign = 'center';
      ctx.fillText(LANE_KEYS[l].toUpperCase(), l * LANE_W + LANE_W / 2, HIT_LINE + 30);
    }
    for (const n of s.notes) {
      if (n.hit) continue;
      const color = n.missed ? '#555' : LANE_COLORS[n.lane];
      ctx.fillStyle = color; ctx.shadowColor = n.missed ? 'transparent' : color; ctx.shadowBlur = n.missed ? 0 : 10;
      ctx.fillRect(n.lane * LANE_W + 8, n.y - NOTE_H / 2, LANE_W - 16, NOTE_H);
      ctx.shadowBlur = 0;
      if (!n.missed) { ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(n.lane * LANE_W + 8, n.y - NOTE_H / 2, LANE_W - 16, NOTE_H); }
    }
    for (const p of s.particles) { ctx.globalAlpha = p.life / 30; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y - (30 - p.life) * 2, 4 + (30 - p.life) * 0.5, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
    if (s.combo >= 5) { ctx.fillStyle = '#ff2bd6'; ctx.font = 'bold 28px "Orbitron", sans-serif'; ctx.textAlign = 'center'; ctx.shadowColor = '#ff2bd6'; ctx.shadowBlur = 12; ctx.fillText(`${s.combo} コンボ`, W / 2, 80); ctx.shadowBlur = 0; }
  };

  useGameLoop((dt) => {
    const s = state.current; if (!started || s.over) return;
    s.elapsed += dt;
    while (s.chartIdx < s.chart.length && s.chart[s.chartIdx].time <= s.elapsed) {
      s.notes.push({ lane: s.chart[s.chartIdx].lane, y: -NOTE_H, hit: false, missed: false, id: noteId.current++ });
      s.chartIdx++;
    }
    for (const n of s.notes) {
      if (n.hit) continue;
      n.y += NOTE_SPEED * dt;
      if (!n.missed && n.y > HIT_LINE + HIT_WINDOW) { n.missed = true; s.combo = 0; s.total++; if (comboRef.current) comboRef.current.textContent = '0'; if (accRef.current) accRef.current.textContent = s.total > 0 ? `${Math.round((s.hits / s.total) * 100)}%` : '—'; }
    }
    s.notes = s.notes.filter((n) => n.y < H + 50);
    for (let l = 0; l < LANES; l++) if (s.laneFlash[l] > 0) s.laneFlash[l] -= dt;
    for (const p of s.particles) p.life -= dt * 0.06;
    s.particles = s.particles.filter((p) => p.life > 0);
    if (s.elapsed >= GAME_TIME * 1000 && s.notes.every((n) => n.hit || n.missed)) { s.over = true; if (overRef.current) overRef.current.style.display = 'flex'; }
    draw();
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (state.current.keys[e.key]) return;
      state.current.keys[e.key] = true;
      const lane = LANE_KEYS.indexOf(e.key.toLowerCase());
      if (lane >= 0) tryHit(lane);
    };
    const up = (e: KeyboardEvent) => { state.current.keys[e.key] = false; };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  return (
    <GameShell title="ビートストライク" accent="#ff2bd6" onExit={onExit} onSwitchGame={onSwitchGame} currentId="rhythm"
      hud={<div className="flex flex-col items-end gap-0.5 font-mono text-xs"><span>スコア <span ref={scoreRef} className="text-neon-magenta">0</span></span><span>コンボ <span ref={comboRef} className="text-neon-yellow">0</span></span><span>精度 <span ref={accRef} className="text-neon-green">—</span></span></div>}
      instructions="D F J K キーでノーツを叩こう / 判定ラインに合わせてタイミングよく">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-full" style={{ maxWidth: W }}>
          <canvas ref={canvasRef} width={W} height={H} className="w-full rounded-lg border-2 border-neon-magenta/60 shadow-neonMagenta" style={{ background: '#05060f' }} />
          {!started && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-lg bg-ink-900/85 backdrop-blur-sm">
              <p className="font-display text-2xl font-900 tracking-widest text-neon-magenta" style={{ textShadow: '0 0 12px #ff2bd6' }}>ビートストライク</p>
              <p className="font-mono text-sm text-cyan-100/70">60秒間、落ちてくるノーツを叩こう</p>
              <div className="flex gap-2 font-mono text-xs">
                {LANE_KEYS.map((k, i) => <span key={i} className="rounded border px-2 py-1" style={{ borderColor: LANE_COLORS[i], color: LANE_COLORS[i] }}>{k.toUpperCase()}</span>)}
              </div>
              <button onClick={start} className="rounded-md border-2 border-neon-magenta bg-neon-magenta/10 px-8 py-3 font-display font-700 uppercase tracking-widest text-neon-magenta transition hover:bg-neon-magenta/20 active:scale-95">スタート</button>
            </div>
          )}
          <div ref={overRef} className="absolute inset-0 hidden flex-col items-center justify-center gap-4 rounded-lg bg-ink-900/90 backdrop-blur-sm">
            <p className="font-display text-2xl font-900 tracking-widest text-neon-magenta" style={{ textShadow: '0 0 12px #ff2bd6' }}>フィニッシュ!</p>
            <div className="flex gap-6 font-mono">
              <div className="text-center"><p className="text-xs text-cyan-100/60">スコア</p><p className="text-2xl text-neon-magenta">{state.current.score}</p></div>
              <div className="text-center"><p className="text-xs text-cyan-100/60">最大コンボ</p><p className="text-2xl text-neon-yellow">{state.current.maxCombo}</p></div>
              <div className="text-center"><p className="text-xs text-cyan-100/60">精度</p><p className="text-2xl text-neon-green">{state.current.total > 0 ? Math.round((state.current.hits / state.current.total) * 100) : 0}%</p></div>
            </div>
            <button onClick={start} className="rounded-md border-2 border-neon-magenta bg-neon-magenta/10 px-6 py-2 font-display font-700 uppercase tracking-widest text-neon-magenta transition hover:bg-neon-magenta/20 active:scale-95">もう一度</button>
          </div>
        </div>
        <div className="flex gap-2 sm:hidden">
          {LANE_KEYS.map((_, i) => <button key={i} onTouchStart={(e) => { e.preventDefault(); tryHit(i); }} className="flex-1 rounded-md border py-4 font-mono text-sm active:scale-90" style={{ borderColor: LANE_COLORS[i], color: LANE_COLORS[i], background: `${LANE_COLORS[i]}15` }}>{LANE_KEYS[i].toUpperCase()}</button>)}
        </div>
      </div>
    </GameShell>
  );
}
