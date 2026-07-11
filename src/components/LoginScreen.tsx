import { useState } from 'react';
import { useAuth, isOAuthConfigured } from '../auth';
import { Gamepad2, LogIn, Zap, ShieldCheck, Terminal } from 'lucide-react';

export function LoginScreen() {
  const { login, demoLogin, error, loading } = useAuth();
  const [username, setUsername] = useState('');
  const configured = isOAuthConfigured();

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-ink-900 scanlines px-4 py-10">
      <div className="pointer-events-none absolute inset-0 cyber-grid-animated opacity-70" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, rgba(0,240,255,0.12), transparent 55%), radial-gradient(ellipse at 50% 90%, rgba(255,43,214,0.12), transparent 55%)',
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-neon-cyan/10 to-transparent animate-scan" />

      <div className="relative z-10 w-full max-w-md">
        {/* ロゴ */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-20 w-20 items-center justify-center rounded-2xl border border-neon-cyan/60 bg-ink-800/80 shadow-neonCyan">
            <Gamepad2 size={40} className="text-neon-cyan animate-pulseGlow" style={{ color: '#00f0ff' }} />
          </div>
          <h1 className="font-display text-4xl font-900 tracking-[0.25em] neon-text-cyan sm:text-5xl">
            ネオン
          </h1>
          <h2 className="font-display text-2xl font-700 tracking-[0.4em] neon-text-magenta sm:text-3xl">
            アーケード
          </h2>
          <p className="mt-3 font-mono text-xs uppercase tracking-[0.3em] text-neon-green/80">
            メガゲームセンター // 15タイトル
          </p>
        </div>

        {/* ログインカード */}
        <div className="rounded-2xl border border-neon-cyan/40 bg-ink-800/80 p-6 shadow-neonCyan backdrop-blur-sm">
          <div className="mb-5 flex items-center gap-2 border-b border-neon-cyan/20 pb-3">
            <ShieldCheck size={16} className="text-neon-green" />
            <span className="font-mono text-xs uppercase tracking-widest text-neon-green/90">
              Cloudflare OpenAuth 連携
            </span>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-neon-yellow/50 bg-neon-yellow/10 px-3 py-2 font-mono text-xs text-neon-yellow">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-6 font-mono text-sm text-neon-cyan">
              <Zap size={18} className="animate-pulse" />
              認証中...
            </div>
          ) : (
            <>
              <button
                onClick={login}
                className="group mb-4 flex w-full items-center justify-center gap-3 rounded-lg border-2 border-neon-cyan bg-neon-cyan/10 px-5 py-3.5 font-display text-base font-700 uppercase tracking-widest text-neon-cyan transition hover:bg-neon-cyan/20 hover:shadow-neonCyan active:scale-95"
              >
                <LogIn size={20} className="transition group-hover:translate-x-0.5" />
                {configured ? 'ネオンログイン' : 'ゲストでログイン'}
              </button>

              {/* デモログイン */}
              <div className="rounded-lg border border-ink-500/60 bg-ink-700/50 p-3">
                <div className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-neon-magenta/80">
                  <Terminal size={12} />
                  デモモード / 任意の名前で入場
                </div>
                <div className="flex gap-2">
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && demoLogin(username)}
                    placeholder="プレイヤー名"
                    maxLength={16}
                    className="flex-1 rounded-md border border-neon-magenta/40 bg-ink-900/80 px-3 py-2 font-mono text-sm text-neon-magenta placeholder:text-neon-magenta/30 focus:border-neon-magenta focus:outline-none"
                  />
                  <button
                    onClick={() => demoLogin(username)}
                    className="rounded-md border border-neon-magenta/60 bg-neon-magenta/10 px-4 py-2 font-mono text-xs uppercase tracking-widest text-neon-magenta transition hover:bg-neon-magenta/20 active:scale-95"
                  >
                    入場
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-ink-500/80">
          // システム v1.0 // 全権利保留
        </p>
      </div>
    </div>
  );
}
