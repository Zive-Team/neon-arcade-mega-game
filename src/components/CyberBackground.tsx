import { type ReactNode } from 'react';

/** サイバーパンク風のネオングリッド + スキャンライン背景。全画面で共有使用。 */
export function CyberBackground({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-ink-900 scanlines">
      {/* グリッド */}
      <div className="pointer-events-none absolute inset-0 cyber-grid-animated opacity-70" />
      {/* ビネット */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(0,240,255,0.10), transparent 55%), radial-gradient(ellipse at 50% 100%, rgba(255,43,214,0.10), transparent 55%)',
        }}
      />
      {/* スキャンバー */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-neon-cyan/10 to-transparent animate-scan" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
