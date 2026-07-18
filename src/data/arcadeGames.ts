export interface ArcadeGame {
  id: string;
  name: string;
  description: string;
  category: 'arcade' | 'puzzles' | 'sports' | 'strategy' | 'runners' | 'fidget';
  themeColor: string;
  accentColor: string;
  difficulty: 'EASY' | 'MEDIUM' | 'EXPERT';
  multiplier: number;
  engine: 'snake' | 'minesweeper' | 'archery' | 'chess_checkers' | 'racing' | 'fidget_engine';
  settings: {
    speed?: number;
    size?: number;
    density?: number;
    gravity?: number;
    botCount?: number;
    windChance?: number;
  };
}

export const ARCADE_CATEGORIES = [
  { id: 'arcade', label: 'Classic Arcade', icon: 'Swords' },
  { id: 'puzzles', label: 'Logic Puzzles', icon: 'Compass' },
  { id: 'sports', label: 'Reflex Sports', icon: 'Trophy' },
  { id: 'strategy', label: 'Board Strategy', icon: 'Zap' },
  { id: 'runners', label: 'Endless Runners', icon: 'Sparkles' },
  { id: 'fidget', label: 'Fidget & Fighting', icon: 'Swords' }
] as const;

export const ARCADE_GAMES_REGISTRY: ArcadeGame[] = [
  {
    id: 'snake_io',
    name: 'Snake.io Arena',
    description: 'Slither through cyber obstacles, eat energy gems, and cut off rival AI serpents.',
    category: 'arcade',
    themeColor: '#10b981',
    accentColor: '#34d399',
    difficulty: 'MEDIUM',
    multiplier: 1.5,
    engine: 'snake',
    settings: { speed: 4.5, botCount: 4, size: 10 }
  },
  {
    id: 'pong_ultimate',
    name: 'Pong Ultimate',
    description: 'Keep the glowing spark between yourself and the firewall.',
    category: 'arcade',
    themeColor: '#a855f7',
    accentColor: '#c084fc',
    difficulty: 'EASY',
    multiplier: 1.1,
    engine: 'snake',
    settings: { speed: 3.5, botCount: 2, size: 7 }
  },
  {
    id: 'mines_classic',
    name: 'Mine Sweep Protocol',
    description: 'Cleanse cells. Mark danger blocks to salvage gold fragments.',
    category: 'puzzles',
    themeColor: '#06b6d4',
    accentColor: '#22d3ee',
    difficulty: 'MEDIUM',
    multiplier: 1.4,
    engine: 'minesweeper',
    settings: { size: 8, density: 10 }
  },
  {
    id: 'archery_pro',
    name: 'Archery Kinetic Pro',
    description: 'Drag back, estimate wind shear, and fire arrows into moving targets.',
    category: 'sports',
    themeColor: '#eab308',
    accentColor: '#facc15',
    difficulty: 'MEDIUM',
    multiplier: 1.5,
    engine: 'archery',
    settings: { speed: 4.5, gravity: 0.15, windChance: 0.5 }
  },
  {
    id: 'racing_gp',
    name: 'Grand Prix Racer',
    description: 'Dodge obstacles on high-velocity roads. Run booster pads to maintain momentum.',
    category: 'runners',
    themeColor: '#fbbf24',
    accentColor: '#fef08a',
    difficulty: 'MEDIUM',
    multiplier: 1.5,
    engine: 'racing',
    settings: { speed: 7.0, density: 10 }
  }
];
