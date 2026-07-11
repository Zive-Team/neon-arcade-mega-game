import { useState, useEffect } from 'react';
import { GameShell } from '../components/GameShell';
import { Brain } from 'lucide-react';
import type { GameId } from '../types';

const SYMBOLS = ['◆', '▲', '●', '■', '★', '♥', '♣', '♠', '♦', '✦'];
const COLORS = ['#00f0ff', '#ff2bd6', '#39ff14', '#fff200', '#9d4bff', '#ff7a00', '#2d7dff', '#ff2d55', '#39ff14', '#00f0ff'];

interface Card { id: number; symbol: string; color: string; flipped: boolean; matched: boolean; }

function makeDeck(pairs: number): Card[] {
  const chosen = SYMBOLS.slice(0, pairs).map((sym, i) => ({ symbol: sym, color: COLORS[i] }));
  const deck = [...chosen, ...chosen].map((c, i) => ({ id: i, symbol: c.symbol, color: c.color, flipped: false, matched: false }));
  for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  return deck;
}

export function MemoryGame({ onExit, onSwitchGame }: { onExit: () => void; onSwitchGame: (id: GameId) => void }) {
  const [pairs, setPairs] = useState(8);
  const [deck, setDeck] = useState<Card[]>(() => makeDeck(8));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matched, setMatched] = useState(0);
  const [lock, setLock] = useState(false);
  const [started, setStarted] = useState(false);
  const [time, setTime] = useState(0);
  const [best, setBest] = useState<number | null>(null);

  useEffect(() => {
    if (!started || matched === pairs) return;
    const t = setInterval(() => setTime((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [started, matched, pairs]);

  const startGame = (p: number) => {
    setPairs(p); setDeck(makeDeck(p)); setFlipped([]); setMoves(0); setMatched(0); setLock(false); setStarted(true); setTime(0);
  };

  const flip = (idx: number) => {
    if (lock || deck[idx].flipped || deck[idx].matched) return;
    const nd = [...deck]; nd[idx] = { ...nd[idx], flipped: true }; setDeck(nd);
    const nf = [...flipped, idx]; setFlipped(nf);
    if (nf.length === 2) {
      setMoves((m) => m + 1); setLock(true);
      const [a, b] = nf;
      if (deck[a].symbol === deck[b].symbol) {
        setTimeout(() => {
          setDeck((d) => { const nd2 = [...d]; nd2[a] = { ...nd2[a], matched: true }; nd2[b] = { ...nd2[b], matched: true }; return nd2; });
          setMatched((m) => m + 1); setFlipped([]); setLock(false);
        }, 500);
      } else {
        setTimeout(() => {
          setDeck((d) => { const nd2 = [...d]; nd2[a] = { ...nd2[a], flipped: false }; nd2[b] = { ...nd2[b], flipped: false }; return nd2; });
          setFlipped([]); setLock(false);
        }, 900);
      }
    }
  };

  const won = matched === pairs && pairs > 0;
  useEffect(() => {
    if (won && (best === null || moves < best)) setBest(moves);
  }, [won, moves, best]);

  const cols = pairs <= 6 ? 'grid-cols-3 sm:grid-cols-4' : pairs <= 8 ? 'grid-cols-4' : 'grid-cols-4 sm:grid-cols-5';

  return (
    <GameShell title="マインドマトリックス" accent="#9d4bff" onExit={onExit} onSwitchGame={onSwitchGame} currentId="memory"
      hud={<div className="flex flex-col items-end gap-0.5 font-mono text-xs"><span>手数 <span className="text-neon-purple">{moves}</span></span><span>ペア <span className="text-neon-green">{matched}/{pairs}</span></span><span>時間 <span className="text-neon-cyan">{time}秒</span></span></div>}
      instructions="2枚のカードをめくって同じマークを揃えよう。手数少なくクリアが目標。">
      <div className="mx-auto max-w-2xl">
        {!started ? (
          <div className="flex flex-col items-center gap-6 py-12">
            <Brain size={56} className="text-neon-purple" style={{ color: '#9d4bff' }} />
            <div className="text-center">
              <p className="font-display text-3xl font-900 tracking-widest text-neon-purple" style={{ textShadow: '0 0 12px #9d4bff' }}>マインドマトリックス</p>
              <p className="mt-2 font-mono text-sm text-cyan-100/70">難易度を選んでスタート</p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <button onClick={() => startGame(6)} className="rounded-lg border-2 border-neon-green/60 bg-neon-green/10 px-6 py-4 font-display font-700 tracking-widest text-neon-green transition hover:bg-neon-green/20 active:scale-95">かんたん<span className="block font-mono text-xs opacity-70">6ペア</span></button>
              <button onClick={() => startGame(8)} className="rounded-lg border-2 border-neon-purple/60 bg-neon-purple/10 px-6 py-4 font-display font-700 tracking-widest text-neon-purple transition hover:bg-neon-purple/20 active:scale-95">ふつう<span className="block font-mono text-xs opacity-70">8ペア</span></button>
              <button onClick={() => startGame(10)} className="rounded-lg border-2 border-neon-red/60 bg-neon-red/10 px-6 py-4 font-display font-700 tracking-widest text-neon-red transition hover:bg-neon-red/20 active:scale-95">むずかしい<span className="block font-mono text-xs opacity-70">10ペア</span></button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className={`grid ${cols} gap-2 sm:gap-3`}>
              {deck.map((card, i) => (
                <button key={card.id} onClick={() => flip(i)} disabled={lock} className="relative flex h-16 items-center justify-center rounded-lg border-2 transition duration-300 active:scale-95 sm:h-20" style={{ borderColor: card.matched ? '#39ff14' : card.flipped ? card.color : '#262d52', background: card.matched ? 'rgba(57,255,20,0.12)' : card.flipped ? `${card.color}15` : '#0a0d1f', boxShadow: card.flipped && !card.matched ? `0 0 12px ${card.color}66` : card.matched ? '0 0 12px rgba(57,255,20,0.4)' : 'none', opacity: card.matched ? 0.6 : 1 }}>
                  {card.flipped || card.matched ? <span className="font-display text-2xl sm:text-3xl" style={{ color: card.color, textShadow: `0 0 8px ${card.color}` }}>{card.symbol}</span> : <span className="font-mono text-lg text-ink-500">?</span>}
                </button>
              ))}
            </div>
            {won && (
              <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-neon-purple/50 bg-ink-900/90 px-8 py-6">
                <p className="font-display text-2xl font-900 tracking-widest text-neon-purple" style={{ textShadow: '0 0 12px #9d4bff' }}>クリア!</p>
                <p className="font-mono text-sm text-cyan-100/80">手数 {moves} / 時間 {time}秒</p>
                {best !== null && <p className="font-mono text-xs text-neon-green">ベスト: {best}手</p>}
                <button onClick={() => startGame(pairs)} className="rounded-md border-2 border-neon-purple bg-neon-purple/10 px-6 py-2 font-display font-700 uppercase tracking-widest text-neon-purple transition hover:bg-neon-purple/20 active:scale-95">もう一度</button>
              </div>
            )}
          </div>
        )}
      </div>
    </GameShell>
  );
}
