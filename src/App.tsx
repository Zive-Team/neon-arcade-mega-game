import { useState } from 'react';
import { GameMenu } from './components/GameMenu';
import type { GameMeta, GameId } from './types';
import { TetrisGame } from './games/TetrisGame';
import { RunnerGame } from './games/RunnerGame';
import { ShooterGame } from './games/ShooterGame';
import { TypingGame } from './games/TypingGame';
import { ClickerGame } from './games/ClickerGame';
import { MemoryGame } from './games/MemoryGame';
import { BreakoutGame } from './games/BreakoutGame';
import { SnakeGame } from './games/SnakeGame';
import { Game2048 } from './games/Game2048';
import { RhythmGame } from './games/RhythmGame';

export default function App() {
  const [active, setActive] = useState<GameMeta | null>(null);

  const switchGame = (id: GameId) => {
    const game = GAMES_MAP[id];
    if (game) setActive(game);
  };

  if (active) {
    const props = { onExit: () => setActive(null), onSwitchGame: switchGame };
    switch (active.id) {
      case 'tetris': return <TetrisGame {...props} />;
      case 'runner': return <RunnerGame {...props} />;
      case 'shooter': return <ShooterGame {...props} />;
      case 'typing': return <TypingGame {...props} />;
      case 'clicker': return <ClickerGame {...props} />;
      case 'memory': return <MemoryGame {...props} />;
      case 'breakout': return <BreakoutGame {...props} />;
      case 'snake': return <SnakeGame {...props} />;
      case '2048': return <Game2048 {...props} />;
      case 'rhythm': return <RhythmGame {...props} />;
    }
  }

  return <GameMenu onSelect={setActive} />;
}

import { GAMES } from './types';
const GAMES_MAP: Record<GameId, GameMeta> = Object.fromEntries(GAMES.map((g) => [g.id, g])) as Record<GameId, GameMeta>;
