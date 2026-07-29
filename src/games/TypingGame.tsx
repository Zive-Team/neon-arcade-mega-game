import { useEffect, useRef, useState } from 'react';
import { GameShell } from '../components/GameShell';
import type { GameId } from '../types';

const WORDS = [
  'cyber', 'neon', 'matrix', 'hacker', 'pixel', 'glitch', 'vector', 'plasma',
  'quantum', 'digital', 'circuit', 'binary', 'protocol', 'firewall', 'encrypt',
  'mainframe', 'synthwave', 'hologram', 'android', 'satellite', 'algorithm',
  'blockchain', 'javascript', 'typescript', 'react', 'canvas', 'shader',
  'render', 'compile', 'runtime', 'kernel', 'overflow', 'recursion', 'lambda',
  'async', 'promise', 'module', 'pointer', 'buffer', 'stream', 'socket',
  'packet', 'router', 'gateway', 'proxy', 'token', 'session', 'cookie',
];
const GAME_TIME = 60;

export function TypingGame({ onExit, onSwitchGame }: { onExit: () => void; onSwitchGame: (id: GameId) => void }) {
  const [started, setStarted] = useState(false);
  const [over, setOver] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [time, setTime] = useState(GAME_TIME);
  const [current, setCurrent] = useState('');
  const [typed, setTyped] = useState('');
  const [queue, setQueue] = useState<string[]>([]);
  const [wpm, setWpm] = useState(0);
  const [correctChars, setCorrectChars] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);

  const start = () => {
    setStarted(true); setOver(false); setScore(0); setCombo(0); setMaxCombo(0); setTime(GAME_TIME); setCorrectChars(0); setWpm(0); setTyped('');
    const first = WORDS[Math.floor(Math.random() * WORDS.length)];
    setCurrent(first); setQueue([]);
    const next: string[] = []; for (let i = 0; i < 8; i++) next.push(WORDS[Math.floor(Math.random() * WORDS.length)]); setQueue(next);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  useEffect(() => {
    if (!started || over) return;
    timerRef.current = window.setInterval(() => {
      setTime((t) => { if (t <= 1) { window.clearInterval(timerRef.current!); setOver(true); return 0; } return t - 1; });
    }, 1000);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, [started, over]);

  useEffect(() => {
    if (correctChars > 0) { const elapsed = (GAME_TIME - time) / 60; if (elapsed > 0) setWpm(Math.round(correctChars / 5 / elapsed)); }
  }, [correctChars, time]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (over) return;
    const val = e.target.value; setTyped(val);
    if (val === current) {
      setCorrectChars((c) => c + current.length + 1);
      setScore((s) => s + 10 + combo * 2);
      setCombo((c) => { const nc = c + 1; setMaxCombo((m) => Math.max(m, nc)); return nc; });
      setTyped('');
      setQueue((q) => { const nq = [...q]; const next = nq.shift() ?? WORDS[Math.floor(Math.random() * WORDS.length)]; setCurrent(next); if (nq.length < 4) for (let i = 0; i < 4; i++) nq.push(WORDS[Math.floor(Math.random() * WORDS.length)]); return nq; });
    } else if (!current.startsWith(val)) { setCombo(0); }
  };

  const timeColor = time <= 10 ? '#ff2d55' : time <= 20 ? '#fff200' : '#39ff14';

  return (
    <GameShell title="キーストーム" accent="#fff200" onExit={onExit} onSwitchGame={onSwitchGame} currentId="typing"
      hud={<div className="flex flex-col items-end gap-0.5 font-mono text-xs"><span>スコア <span className="text-neon-yellow">{score}</span></span><span>WPM <span className="text-neon-cyan">{wpm}</span></span><span style={{ color: timeColor }}>残り {time}秒</span></div>}
      instructions="表示された単語を入力してください。連続正解でコンボボーナス。">
      <div className="mx-auto max-w-2xl">
        {!started ? (
          <div className="flex flex-col items-center gap-6 py-16">
            <div className="text-center">
              <p className="font-display text-3xl font-900 tracking-widest text-neon-yellow" style={{ textShadow: '0 0 12px #fff200' }}>キーストーム</p>
              <p className="mt-2 font-mono text-sm text-cyan-100/70">60秒間でできるだけ多くの単語を打とう</p>
            </div>
            <button onClick={start} className="rounded-lg border-2 border-neon-yellow bg-neon-yellow/10 px-10 py-4 font-display text-lg font-700 uppercase tracking-widest text-neon-yellow transition hover:bg-neon-yellow/20 active:scale-95" style={{ boxShadow: '0 0 12px rgba(255,242,0,0.4)' }}>スタート</button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 py-8">
            {combo >= 3 && <div className="font-display text-2xl font-900 tracking-widest text-neon-magenta animate-flicker" style={{ textShadow: '0 0 12px #ff2bd6' }}>{combo} コンボ!</div>}
            <div className="relative w-full rounded-xl border-2 border-neon-yellow/50 bg-ink-800/80 px-6 py-8 text-center" style={{ boxShadow: '0 0 16px rgba(255,242,0,0.25)' }}>
              <p className="mb-2 font-mono text-xs uppercase tracking-widest text-neon-yellow/60">これを入力</p>
              <div className="flex flex-wrap justify-center gap-1 font-mono text-3xl tracking-wider sm:text-4xl">
                {current.split('').map((ch, i) => {
                  const done = i < typed.length; const correct = done && typed[i] === ch; const wrong = done && typed[i] !== ch;
                  return <span key={i} style={{ color: correct ? '#39ff14' : wrong ? '#ff2d55' : '#fff200', textShadow: correct ? '0 0 8px #39ff14' : wrong ? '0 0 8px #ff2d55' : '0 0 8px #fff200' }}>{ch}</span>;
                })}
              </div>
            </div>
            <input ref={inputRef} value={typed} onChange={handleInput} disabled={over} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} className="w-full max-w-md rounded-lg border-2 border-neon-yellow/40 bg-ink-900/80 px-4 py-3 text-center font-mono text-xl text-neon-yellow focus:border-neon-yellow focus:outline-none" placeholder="..." />
            <div className="flex flex-wrap justify-center gap-2">
              {queue.slice(0, 6).map((w, i) => <span key={i} className="rounded-md border border-ink-500/60 bg-ink-700/50 px-3 py-1 font-mono text-sm" style={{ opacity: 1 - i * 0.13, color: '#00f0ff' }}>{w}</span>)}
            </div>
            <div className="flex gap-6 font-mono text-sm"><span className="text-neon-cyan">最大コンボ <span className="text-neon-magenta">{maxCombo}</span></span></div>
            {over && (
              <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-neon-yellow/50 bg-ink-900/90 px-10 py-8">
                <p className="font-display text-2xl font-900 tracking-widest text-neon-yellow" style={{ textShadow: '0 0 12px #fff200' }}>タイムアップ</p>
                <div className="flex gap-8 font-mono">
                  <div className="text-center"><p className="text-xs text-cyan-100/60">スコア</p><p className="text-2xl text-neon-yellow">{score}</p></div>
                  <div className="text-center"><p className="text-xs text-cyan-100/60">WPM</p><p className="text-2xl text-neon-cyan">{wpm}</p></div>
                  <div className="text-center"><p className="text-xs text-cyan-100/60">最大コンボ</p><p className="text-2xl text-neon-magenta">{maxCombo}</p></div>
                </div>
                <button onClick={start} className="rounded-md border-2 border-neon-yellow bg-neon-yellow/10 px-6 py-2 font-display font-700 uppercase tracking-widest text-neon-yellow transition hover:bg-neon-yellow/20 active:scale-95">もう一度</button>
              </div>
            )}
          </div>
        )}
      </div>
    </GameShell>
  );
}
