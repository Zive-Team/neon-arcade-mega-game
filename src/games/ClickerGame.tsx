import { useEffect, useRef, useState } from 'react';
import { GameShell } from '../components/GameShell';
import { useGameLoop } from '../hooks/useGameLoop';
import { Zap, MousePointerClick, TrendingUp, Sparkles } from 'lucide-react';
import type { GameId } from '../types';

interface FloatNum { id: number; x: number; y: number; val: number; life: number; }

export function ClickerGame({ onExit, onSwitchGame }: { onExit: () => void; onSwitchGame: (id: GameId) => void }) {
  const [count, setCount] = useState(0);
  const [perClick, setPerClick] = useState(1);
  const [perSec, setPerSec] = useState(0);
  const [floats, setFloats] = useState<FloatNum[]>([]);
  const [clickPowerLvl, setClickPowerLvl] = useState(1);
  const [autoLvl, setAutoLvl] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lastClick, setLastClick] = useState(0);
  const floatId = useRef(0);
  const countRef = useRef(0);
  const comboRef = useRef(0);
  const lastClickRef = useRef(0);

  const CLICK_COST = (lvl: number) => 10 * Math.pow(1.5, lvl - 1);
  const AUTO_COST = (lvl: number) => 25 * Math.pow(1.6, lvl);

  useEffect(() => { countRef.current = count; }, [count]);
  useEffect(() => { comboRef.current = combo; }, [combo]);
  useEffect(() => { lastClickRef.current = lastClick; }, [lastClick]);

  useGameLoop((dt) => {
    if (perSec > 0) setCount((c) => c + (perSec * dt) / 1000);
    if (Date.now() - lastClickRef.current > 1500 && comboRef.current > 0) setCombo(0);
    setFloats((fs) => fs.map((f) => ({ ...f, y: f.y - 1.2, life: f.life - 1 })).filter((f) => f.life > 0));
  });

  const click = (e: React.MouseEvent<HTMLButtonElement>) => {
    const now = Date.now();
    const fast = now - lastClickRef.current < 400;
    const newCombo = fast ? comboRef.current + 1 : 1;
    setCombo(newCombo); setLastClick(now);
    const bonus = newCombo >= 10 ? 3 : newCombo >= 5 ? 2 : 1;
    const gain = perClick * bonus;
    setCount((c) => c + gain);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left; const y = e.clientY - rect.top;
    setFloats((fs) => [...fs, { id: floatId.current++, x, y, val: gain, life: 50 }]);
  };
  const buyClick = () => { const cost = Math.floor(CLICK_COST(clickPowerLvl)); if (countRef.current >= cost) { setCount((c) => c - cost); setPerClick((p) => p + 1); setClickPowerLvl((l) => l + 1); } };
  const buyAuto = () => { const cost = Math.floor(AUTO_COST(autoLvl)); if (countRef.current >= cost) { setCount((c) => c - cost); setPerSec((p) => p + 1); setAutoLvl((l) => l + 1); } };
  const reset = () => { setCount(0); setPerClick(1); setPerSec(0); setClickPowerLvl(1); setAutoLvl(0); setCombo(0); setFloats([]); };

  const displayCount = Math.floor(count);
  const clickCost = Math.floor(CLICK_COST(clickPowerLvl));
  const autoCost = Math.floor(AUTO_COST(autoLvl));

  return (
    <GameShell title="タップフレンジー" accent="#ff7a00" onExit={onExit} onSwitchGame={onSwitchGame} currentId="clicker"
      hud={<div className="flex flex-col items-end gap-0.5 font-mono text-xs"><span>威力 <span className="text-neon-orange">x{perClick}</span></span><span>自動 <span className="text-neon-cyan">{perSec}/秒</span></span></div>}
      instructions="ボタンを連打して数字を増やそう。高速連打でコンボボーナス。アップグレードで強化。">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 text-center">
          <div className="font-display text-5xl font-900 tracking-wider text-neon-orange sm:text-7xl" style={{ textShadow: '0 0 16px #ff7a00, 0 0 40px rgba(255,122,0,0.5)' }}>{displayCount.toLocaleString()}</div>
          <p className="mt-1 font-mono text-xs uppercase tracking-widest text-neon-orange/60">クレジット</p>
        </div>
        {combo >= 5 && (
          <div className="mb-4 text-center">
            <span className="font-display text-xl font-700 tracking-widest animate-flicker" style={{ color: combo >= 10 ? '#ff2bd6' : '#fff200', textShadow: `0 0 10px ${combo >= 10 ? '#ff2bd6' : '#fff200'}` }}>{combo >= 10 ? 'スーパー ' : ''}{combo}倍 コンボ</span>
          </div>
        )}
        <div className="mb-8 flex justify-center">
          <button onClick={click} className="group relative flex h-48 w-48 items-center justify-center rounded-full border-4 border-neon-orange bg-neon-orange/10 transition active:scale-95 sm:h-56 sm:w-56" style={{ boxShadow: '0 0 24px rgba(255,122,0,0.5), inset 0 0 24px rgba(255,122,0,0.2)' }}>
            <div className="pointer-events-none absolute inset-0 rounded-full border-2 border-neon-orange/30 animate-pulseGlow" style={{ color: '#ff7a00' }} />
            <div className="flex flex-col items-center gap-2">
              <MousePointerClick size={56} className="text-neon-orange transition group-hover:scale-110" style={{ color: '#ff7a00' }} />
              <span className="font-display text-lg font-700 tracking-widest text-neon-orange">タップ!</span>
              <span className="font-mono text-xs text-neon-orange/70">+{perClick}</span>
            </div>
            {floats.map((f) => <span key={f.id} className="pointer-events-none absolute font-mono text-lg font-700" style={{ left: f.x, top: f.y, color: '#39ff14', textShadow: '0 0 8px #39ff14', opacity: f.life / 50 }}>+{f.val}</span>)}
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <UpgradeCard icon={<Zap size={20} />} title="クリック威力" desc={`1クリック +${perClick} → +${perClick + 1}`} level={clickPowerLvl} cost={clickCost} affordable={count >= clickCost} accent="#ff7a00" onClick={buyClick} />
          <UpgradeCard icon={<TrendingUp size={20} />} title="オートタップ" desc={`毎秒 +${perSec} → +${perSec + 1}`} level={autoLvl} cost={autoCost} affordable={count >= autoCost} accent="#00f0ff" onClick={buyAuto} />
        </div>
        <div className="mt-6 text-center">
          <button onClick={reset} className="rounded-md border border-neon-red/40 bg-neon-red/10 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-neon-red transition hover:bg-neon-red/20 active:scale-95">リセット</button>
        </div>
      </div>
    </GameShell>
  );
}

function UpgradeCard({ icon, title, desc, level, cost, affordable, accent, onClick }: { icon: React.ReactNode; title: string; desc: string; level: number; cost: number; affordable: boolean; accent: string; onClick: () => void; }) {
  return (
    <button onClick={onClick} disabled={!affordable} className="group flex items-center gap-3 rounded-xl border bg-ink-800/70 p-4 text-left transition" style={{ borderColor: affordable ? `${accent}88` : '#262d52', opacity: affordable ? 1 : 0.5, boxShadow: affordable ? `0 0 12px ${accent}33` : 'none' }}>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border" style={{ borderColor: `${accent}66`, background: `${accent}15`, color: accent }}>{icon}</div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-700 tracking-widest" style={{ color: accent }}>{title}</span>
          <span className="rounded-full border px-1.5 py-0.5 font-mono text-[10px]" style={{ borderColor: `${accent}55`, color: accent }}>Lv.{level}</span>
        </div>
        <p className="mt-0.5 font-mono text-xs text-cyan-100/60">{desc}</p>
        <div className="mt-1 flex items-center gap-1 font-mono text-sm" style={{ color: affordable ? '#39ff14' : '#ff2d55' }}><Sparkles size={12} />{cost.toLocaleString()} クレジット</div>
      </div>
    </button>
  );
}
