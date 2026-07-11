export type GameId =
  | 'tetris' | 'runner' | 'shooter' | 'typing' | 'clicker'
  | 'memory' | 'breakout' | 'snake' | '2048' | 'rhythm';

export interface GameMeta {
  id: GameId;
  title: string;
  subtitle: string;
  category: string;
  accent: 'cyan' | 'magenta' | 'green' | 'yellow' | 'orange' | 'purple' | 'red' | 'blue';
  icon: string;
}

export const GAMES: GameMeta[] = [
  { id: 'tetris', title: 'ブロックフォール', subtitle: '落ち物パズル', category: 'パズル', accent: 'cyan', icon: 'Boxes' },
  { id: 'runner', title: 'ネオンダッシュ', subtitle: '横スクロールジャンプ', category: 'アクション', accent: 'magenta', icon: 'Footprints' },
  { id: 'shooter', title: 'スターバースト', subtitle: '2D宇宙シューティング', category: 'シューター', accent: 'green', icon: 'Rocket' },
  { id: 'typing', title: 'キーストーム', subtitle: 'タイピングゲーム', category: 'タイピング', accent: 'yellow', icon: 'Keyboard' },
  { id: 'clicker', title: 'タップフレンジー', subtitle: 'クリッカーゲーム', category: 'クリッカー', accent: 'orange', icon: 'MousePointerClick' },
  { id: 'memory', title: 'マインドマトリックス', subtitle: '神経衰弱カードめくり', category: 'メモリー', accent: 'purple', icon: 'Brain' },
  { id: 'breakout', title: 'ブリックブレイカー', subtitle: 'パドルでボールを跳ね返す', category: 'アーケード', accent: 'blue', icon: 'SquareStack' },
  { id: 'snake', title: 'サーキットスネーク', subtitle: 'エサを食べてヘビが長くなる', category: 'アーケード', accent: 'green', icon: 'Route' },
  { id: '2048', title: 'フュージョン2048', subtitle: '数字を重ねて2048を目指す', category: 'パズル', accent: 'orange', icon: 'Grid3x3' },
  { id: 'rhythm', title: 'ビートストライク', subtitle: '落ちてくるノーツを叩く', category: 'リズム', accent: 'magenta', icon: 'Music' },
];

export const ACCENT_HEX: Record<GameMeta['accent'], string> = {
  cyan: '#00f0ff', magenta: '#ff2bd6', green: '#39ff14', yellow: '#fff200',
  orange: '#ff7a00', purple: '#9d4bff', red: '#ff2d55', blue: '#2d7dff',
};
