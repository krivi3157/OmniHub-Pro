import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, ChevronRight, Swords, Compass, Sparkles, Zap, 
  ArrowLeft, Search, RefreshCw, Play, Volume2, ShieldAlert
} from 'lucide-react';
import { UserState } from '../types';
import { ARCADE_GAMES_REGISTRY, ARCADE_CATEGORIES, ArcadeGame } from '../data/arcadeGames';

interface ArcadeWidgetProps {
  userState: UserState;
  onEarnGold: (amount: number) => void;
  triggerNotification: (title: string, msg: string) => void;
  initialGame?: string;
}

export default function ArcadeWidget({ userState, onEarnGold, triggerNotification, initialGame }: ArcadeWidgetProps) {
  // Navigation & Browsing state
  const [activeTab, setActiveTab] = useState<'arcade' | 'puzzles' | 'sports' | 'strategy' | 'runners'>('arcade');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState<ArcadeGame | null>(null);

  // Connection/AI Mode: Offline AI execution fallback
  const [networkingMode, setNetworkingMode] = useState<'offline' | 'cloud'>('offline');

  useEffect(() => {
    if (initialGame) {
      const g = ARCADE_GAMES_REGISTRY.find(x => x.id === initialGame || x.engine === initialGame);
      if (g) setSelectedGame(g);
    }
  }, [initialGame]);

  // Handle game select
  const launchGame = (game: ArcadeGame) => {
    setSelectedGame(game);
    triggerNotification('Cabinet Initializing', `Launching high-fidelity engine for ${game.name}...`);
  };

  const handleExitToCabinet = () => {
    setSelectedGame(null);
  };

  // Filtered games catalog list
  const filteredGames = ARCADE_GAMES_REGISTRY.filter(game => {
    const matchesTab = game.category === activeTab;
    const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          game.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full space-y-4 font-sans select-none text-slate-200" id="arcade_suite_root">
      
      {!selectedGame ? (
        // --- ARCADE CATALOG PROTOCOL VIEW ---
        <div className="space-y-4">
          {/* Header */}
          <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-3xl border border-slate-850">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Swords className="w-4 h-4 text-emerald-400 animate-pulse" />
                OmniHub Arcade Cabinet
              </h2>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">100+ HIGH-FIDELITY CASED MINI-GAMES • DESKTOP & MOBILE KEYED</p>
            </div>
            
            <div className="flex items-center gap-2 text-xs font-mono bg-slate-950 px-3 py-1.5 rounded-2xl border border-slate-800">
              <span className="text-slate-500">NET:</span>
              <button 
                onClick={() => setNetworkingMode(m => m === 'offline' ? 'cloud' : 'offline')}
                className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${
                  networkingMode === 'offline' 
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' 
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}
              >
                {networkingMode === 'offline' ? 'OFFLINE AI FALLBACK' : 'CLOUD SYNC'}
              </button>
            </div>
          </div>

          {/* Categorical expandable tab row */}
          <div className="grid grid-cols-5 bg-slate-900 border border-slate-850 p-1 rounded-2xl gap-1">
            {ARCADE_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id as any)}
                className={`py-2 text-center rounded-xl text-[10px] uppercase font-black transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  activeTab === cat.id
                    ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <span>{cat.label.split(' ')[1]}</span>
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search through 100+ games catalog..."
              className="w-full bg-slate-950 border border-slate-850 rounded-2xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
          </div>

          {/* Games list scroll */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
            {filteredGames.map(game => (
              <div
                key={game.id}
                onClick={() => launchGame(game)}
                className="bg-slate-900/40 border border-slate-850 hover:border-emerald-500/30 p-4 rounded-2xl flex flex-col justify-between cursor-pointer hover:bg-slate-900 transition-all group"
              >
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-black text-white group-hover:text-emerald-400 transition-colors">{game.name}</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded font-mono font-bold" style={{ backgroundColor: game.themeColor + '20', color: game.themeColor }}>
                      {game.difficulty}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">{game.description}</p>
                </div>

                <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-800/60 text-[9px] font-mono">
                  <span className="text-slate-500">PAYOUT YIELD: {game.multiplier}X</span>
                  <span className="text-emerald-400 flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                    LAUNCH CABINET <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
            {filteredGames.length === 0 && (
              <div className="col-span-full text-center py-10 text-slate-500 font-mono text-xs">
                No telemetry matching nodes found in this sector.
              </div>
            )}
          </div>
        </div>
      ) : (
        // --- GAME ENGINE WRAPPER (Active Arcade Cabin Cabinet) ---
        <div className="space-y-4">
          {/* Active Cabin Top Bar */}
          <div className="flex justify-between items-center bg-slate-950 p-3 rounded-2xl border border-slate-850">
            <button
              onClick={handleExitToCabinet}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-all font-bold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              BACK TO CABINET
            </button>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: selectedGame.themeColor }} />
              <span className="text-xs font-black text-white uppercase font-mono tracking-tight">{selectedGame.name}</span>
            </div>

            <div className="text-[9px] font-mono text-slate-400 px-2.5 py-0.5 bg-slate-900 rounded-lg">
              YIELD: {selectedGame.multiplier}X GOLD
            </div>
          </div>

          {/* ENGINE RENDER CONSOLE CARD */}
          <div className="bg-slate-950 border border-slate-850/80 rounded-3xl p-5 flex flex-col items-center">
            {selectedGame.engine === 'snake' && (
              <SnakeEngine game={selectedGame} onEarnGold={onEarnGold} triggerNotification={triggerNotification} />
            )}
            {selectedGame.engine === 'minesweeper' && (
              <MinesweeperEngine game={selectedGame} onEarnGold={onEarnGold} triggerNotification={triggerNotification} />
            )}
            {selectedGame.engine === 'archery' && (
              <ArcheryEngine game={selectedGame} onEarnGold={onEarnGold} triggerNotification={triggerNotification} />
            )}
            {selectedGame.engine === 'chess_checkers' && (
              <ChessCheckersEngine game={selectedGame} onEarnGold={onEarnGold} triggerNotification={triggerNotification} />
            )}
            {selectedGame.engine === 'racing' && (
              <RacingEngine game={selectedGame} onEarnGold={onEarnGold} triggerNotification={triggerNotification} />
            )}
            {selectedGame.engine === 'fidget_engine' as any && (
              <FidgetEngine game={selectedGame} onEarnGold={onEarnGold} triggerNotification={triggerNotification} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 1. DYNAMIC MULTI-MODE ARCADE ENGINE (SNAKE, PACMAN, GALAGA, PONG, ASTEROIDS)
// ==========================================
function SnakeEngine({ game, onEarnGold, triggerNotification }: { game: ArcadeGame; onEarnGold: (a: number) => void; triggerNotification: any }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [controlType, setControlType] = useState<'cursor' | 'joystick'>('cursor');

  // Multi-game references
  const headPos = useRef({ x: 150, y: 150 });
  const playerAngle = useRef(0);
  const trailHistory = useRef<{ x: number; y: number }[]>([]);
  const lengthRef = useRef(5);

  const gems = useRef<{ x: number; y: number; color: string; value: number }[]>([]);
  const bots = useRef<{ id: string; name: string; x: number; y: number; angle: number; length: number; color: string; history: { x: number; y: number }[] }[]>([]);
  const pointerPos = useRef({ x: 150, y: 150 });
  const sparks = useRef<{ x: number; y: number; vx: number; vy: number; color: string; size: number; alpha: number; life: number }[]>([]);

  // Bullet arrays for Galaga & Asteroids
  const bullets = useRef<{ x: number; y: number; vx: number; vy: number }[]>([]);
  // Ball for Pong
  const ball = useRef({ x: 150, y: 100, vx: 2.5, vy: -3.5 });
  // Invaders/Aliens for Galaga / Space Invaders
  const invaders = useRef<{ x: number; y: number; alive: boolean; direction: number }[]>([]);
  // Asteroids
  const asteroids = useRef<{ x: number; y: number; vx: number; vy: number; size: number; alive: boolean }[]>([]);

  // Custom retro game state refs
  const centipedeSegments = useRef<{ x: number; y: number; vx: number }[]>([]);
  const breakoutBricks = useRef<{ x: number; y: number; w: number; h: number; active: boolean; color: string }[]>([]);
  const froggerCars = useRef<{ x: number; y: number; w: number; h: number; vx: number; color: string }[]>([]);
  const dkBarrels = useRef<{ x: number; y: number; vx: number; vy: number }[]>([]);

  // Controls for mobile / manual
  const joyActiveRef = useRef(false);
  const joyOffsetRef = useRef({ x: 0, y: 0 });

  const initGame = () => {
    headPos.current = { x: 150, y: 150 };
    playerAngle.current = 0;
    lengthRef.current = 5;
    trailHistory.current = [];
    setScore(0);
    setGameOver(false);
    bullets.current = [];
    sparks.current = [];

    if (game.id === 'pong_ultimate') {
      ball.current = { x: 150, y: 100, vx: (Math.random() > 0.5 ? 2.8 : -2.8), vy: 3.5 };
      headPos.current = { x: 150, y: 240 };
    } else if (game.id === 'galaga_cmd' || game.id === 'space_invaders') {
      headPos.current = { x: 150, y: 240 };
      invaders.current = Array(12).fill(null).map((_, i) => ({
        x: 40 + (i % 6) * 40,
        y: 35 + Math.floor(i / 6) * 35,
        alive: true,
        direction: 1
      }));
    } else if (game.id === 'asteroids_vector') {
      headPos.current = { x: 150, y: 130 };
      asteroids.current = Array(6).fill(null).map(() => ({
        x: Math.random() * 300,
        y: Math.random() * 100 + 20,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 7 + 10,
        alive: true
      }));
    } else if (game.id === 'centipede_retro') {
      headPos.current = { x: 150, y: 240 };
      centipedeSegments.current = Array(10).fill(null).map((_, i) => ({
        x: 40 + i * 18,
        y: 40,
        vx: 1.8
      }));
    } else if (game.id === 'breakout_brick') {
      headPos.current = { x: 150, y: 250 };
      ball.current = { x: 150, y: 150, vx: 2.2, vy: -2.2 };
      const colors = ['#ef4444', '#f97316', '#eab308', '#10b981', '#3b82f6'];
      const bricks: { x: number; y: number; w: number; h: number; active: boolean; color: string }[] = [];
      for (let r = 0; r < 4; r++) { // let's do 4 rows
        for (let c = 0; c < 6; c++) {
          bricks.push({
            x: 25 + c * 43,
            y: 40 + r * 16,
            w: 36,
            h: 10,
            active: true,
            color: colors[r % colors.length]
          });
        }
      }
      breakoutBricks.current = bricks;
    } else if (game.id === 'frogger_cross') {
      headPos.current = { x: 150, y: 260 };
      const cars: { x: number; y: number; w: number; h: number; vx: number; color: string }[] = [];
      const colors = ['#f43f5e', '#3b82f6', '#eab308'];
      for (let r = 0; r < 3; r++) {
        cars.push({
          x: Math.random() * 200,
          y: 80 + r * 50,
          w: 32,
          h: 12,
          vx: (r % 2 === 0 ? 1 : -1) * (1.2 + Math.random() * 0.8),
          color: colors[r]
        });
      }
      froggerCars.current = cars;
    } else if (game.id === 'donkey_kong_retro') {
      headPos.current = { x: 40, y: 250 };
      dkBarrels.current = [
        { x: 260, y: 70, vx: -1.4, vy: 0 },
        { x: 50, y: 130, vx: 1.4, vy: 0 }
      ];
    } else {
      // Classic Snake or Pac-Man
      const colors = ['#f43f5e', '#10b981', '#3b82f6', '#ea580c', '#eab308'];
      gems.current = Array(18).fill(null).map(() => ({
        x: Math.random() * 280 + 10,
        y: Math.random() * 280 + 10,
        color: game.id === 'pac_arena' ? '#facc15' : colors[Math.floor(Math.random() * colors.length)],
        value: 15
      }));

      const botCount = game.settings.botCount || 3;
      const botNames = ['ViperAI', 'PythonBot', 'Anacondax', 'Cobragun'];
      bots.current = Array(botCount).fill(null).map((_, i) => {
        let bx = Math.random() * 260 + 20;
        let by = Math.random() * 260 + 20;
        while (Math.hypot(bx - 150, by - 150) < 60) {
          bx = Math.random() * 260 + 20;
          by = Math.random() * 260 + 20;
        }
        return {
          id: `bot_${i}`,
          name: botNames[i % botNames.length],
          x: bx,
          y: by,
          angle: Math.random() * Math.PI * 2,
          length: 5,
          color: colors[(i + 1) % colors.length],
          history: []
        };
      });
    }
  };

  const createSparks = (x: number, y: number, color: string, count = 10) => {
    for (let s = 0; s < count; s++) {
      sparks.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        color,
        size: Math.random() * 2 + 1,
        alpha: 1.0,
        life: 15
      });
    }
  };

  useEffect(() => {
    initGame();
  }, [game]);

  // Handle fire click
  const handleCanvasClick = () => {
    if (gameOver) return;
    if (game.id === 'galaga_cmd' || game.id === 'space_invaders') {
      bullets.current.push({ x: headPos.current.x, y: 220, vx: 0, vy: -6 });
    } else if (game.id === 'asteroids_vector') {
      const vx = Math.cos(playerAngle.current) * 6;
      const vy = Math.sin(playerAngle.current) * 6;
      bullets.current.push({ x: headPos.current.x, y: headPos.current.y, vx, vy });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const loop = () => {
      if (gameOver) return;

      // Draw background board grid
      ctx.fillStyle = '#060814';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = 'rgba(99, 102, 241, 0.08)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height);
        ctx.moveTo(0, i); ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Render sparks
      for (let i = sparks.current.length - 1; i >= 0; i--) {
        const s = sparks.current[i];
        s.x += s.vx; s.y += s.vy;
        s.alpha -= 0.04; s.life--;
        if (s.alpha <= 0 || s.life <= 0) {
          sparks.current.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      const speed = game.settings.speed || 4.5;

      // ------------------------------------
      // MODE A: PONG SURVIVAL PADDLE ENGINE
      // ------------------------------------
      if (game.id === 'pong_ultimate') {
        if (controlType === 'cursor') {
          headPos.current.x += (pointerPos.current.x - headPos.current.x) * 0.22;
        } else {
          if (joyActiveRef.current) {
            headPos.current.x += joyOffsetRef.current.x * speed * 1.5;
          }
        }
        headPos.current.x = Math.max(30, Math.min(270, headPos.current.x));
        headPos.current.y = 240;

        ball.current.x += ball.current.vx;
        ball.current.y += ball.current.vy;

        // Bounce left/right walls
        if (ball.current.x < 6 || ball.current.x > 294) {
          ball.current.vx *= -1;
          createSparks(ball.current.x, ball.current.y, '#ffffff', 4);
        }
        // Bounce ceiling
        if (ball.current.y < 6) {
          ball.current.vy *= -1;
          createSparks(ball.current.x, ball.current.y, '#ffffff', 4);
        }

        // Bounce paddle
        if (ball.current.y >= 232 && ball.current.y <= 238 &&
            ball.current.x >= headPos.current.x - 30 && ball.current.x <= headPos.current.x + 30) {
          ball.current.vy = -Math.abs(ball.current.vy) * 1.05; // speed up
          ball.current.vx += (ball.current.x - headPos.current.x) * 0.15;
          setScore(s => s + 10);
          onEarnGold(Math.floor(8 * game.multiplier));
          createSparks(ball.current.x, ball.current.y, game.themeColor, 12);
        }

        // Out at bottom
        if (ball.current.y > 260) {
          setGameOver(true);
          triggerNotification('Firewall Breached', 'The Pong projectile passed through your system perimeter.');
        }

        // Render paddle
        ctx.save();
        ctx.fillStyle = game.themeColor;
        ctx.shadowColor = game.accentColor;
        ctx.shadowBlur = 10;
        ctx.fillRect(headPos.current.x - 30, 236, 60, 8);
        ctx.restore();

        // Render ball
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ball.current.x, ball.current.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // ------------------------------------
      // MODE B: GALAGA / SPACE INVADERS SHOOTER ENGINE
      // ------------------------------------
      else if (game.id === 'galaga_cmd' || game.id === 'space_invaders') {
        if (controlType === 'cursor') {
          headPos.current.x += (pointerPos.current.x - headPos.current.x) * 0.22;
        } else {
          if (joyActiveRef.current) {
            headPos.current.x += joyOffsetRef.current.x * speed * 1.5;
          }
        }
        headPos.current.x = Math.max(20, Math.min(280, headPos.current.x));
        headPos.current.y = 240;

        // Auto shooter cadence
        if (Math.random() < 0.05) {
          bullets.current.push({ x: headPos.current.x, y: 220, vx: 0, vy: -5.5 });
        }

        // Update Bullets
        bullets.current.forEach((b, idx) => {
          b.y += b.vy;
          if (b.y < 0) {
            bullets.current.splice(idx, 1);
          }
        });

        // Update Invaders
        let anyAlive = false;
        invaders.current.forEach(inv => {
          if (!inv.alive) return;
          anyAlive = true;

          inv.x += inv.direction * 0.9;
          if (inv.x > 280) { inv.direction = -1; inv.y += 12; }
          if (inv.x < 20) { inv.direction = 1; inv.y += 12; }

          // Check hit with bullet
          bullets.current.forEach((b, bIdx) => {
            if (Math.hypot(b.x - inv.x, b.y - inv.y) < 14) {
              inv.alive = false;
              bullets.current.splice(bIdx, 1);
              setScore(s => s + 25);
              onEarnGold(Math.floor(10 * game.multiplier));
              createSparks(inv.x, inv.y, game.themeColor, 15);
            }
          });

          // Invasion breached boundary
          if (inv.y > 220) {
            setGameOver(true);
            triggerNotification('Sector Breached', 'Aliens descended too far. Defense shield offline.');
          }

          // Render Alien Node
          ctx.save();
          ctx.fillStyle = game.themeColor;
          ctx.shadowColor = game.accentColor;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(inv.x, inv.y - 7);
          ctx.lineTo(inv.x - 7, inv.y + 7);
          ctx.lineTo(inv.x + 7, inv.y + 7);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        });

        if (!anyAlive) {
          invaders.current.forEach(i => i.alive = true);
          triggerNotification('Level Cleared!', 'New invasion wave vector generated.');
        }

        // Draw Player Spaceship
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#60a5fa';
        ctx.shadowBlur = 8;
        ctx.fillRect(headPos.current.x - 12, 230, 24, 10);
        ctx.fillRect(headPos.current.x - 3, 222, 6, 8);
        ctx.restore();

        // Draw Bullets
        ctx.fillStyle = '#f43f5e';
        bullets.current.forEach(b => {
          ctx.fillRect(b.x - 1.5, b.y - 4, 3, 8);
        });
      }

      // ------------------------------------
      // MODE C: ASTEROIDS VECTOR PHYSICS ENGINE
      // ------------------------------------
      else if (game.id === 'asteroids_vector') {
        const dx = pointerPos.current.x - 150;
        const dy = pointerPos.current.y - 130;
        playerAngle.current = Math.atan2(dy, dx);
        headPos.current = { x: 150, y: 130 };

        // Auto-fire or manual on tap/click
        if (Math.random() < 0.05) {
          const vx = Math.cos(playerAngle.current) * 6;
          const vy = Math.sin(playerAngle.current) * 6;
          bullets.current.push({ x: 150, y: 130, vx, vy });
        }

        // Update bullets
        bullets.current.forEach((b, idx) => {
          b.x += b.vx;
          b.y += b.vy;
          if (b.x < 0 || b.x > 300 || b.y < 0 || b.y > 260) {
            bullets.current.splice(idx, 1);
          }
        });

        // Update Asteroids
        asteroids.current.forEach(ast => {
          if (!ast.alive) return;
          ast.x += ast.vx;
          ast.y += ast.vy;

          if (ast.x < 0) ast.x = 300;
          if (ast.x > 300) ast.x = 0;
          if (ast.y < 0) ast.y = 260;
          if (ast.y > 260) ast.y = 0;

          // Bullet collision
          bullets.current.forEach((b, bIdx) => {
            if (Math.hypot(b.x - ast.x, b.y - ast.y) < ast.size + 4) {
              ast.alive = false;
              bullets.current.splice(bIdx, 1);
              setScore(s => s + 30);
              onEarnGold(Math.floor(12 * game.multiplier));
              createSparks(ast.x, ast.y, game.themeColor, 18);

              // Respawn
              setTimeout(() => {
                ast.x = Math.random() * 300;
                ast.y = Math.random() * 80;
                ast.vx = (Math.random() - 0.5) * 2;
                ast.vy = (Math.random() - 0.5) * 2;
                ast.alive = true;
              }, 1000);
            }
          });

          // Crash ship
          if (Math.hypot(150 - ast.x, 130 - ast.y) < ast.size + 10) {
            setGameOver(true);
            triggerNotification('HULL COLLAPSED', 'Steered straight into asteroid particle field.');
          }

          // Draw Asteroid
          ctx.save();
          ctx.strokeStyle = game.themeColor;
          ctx.shadowColor = game.accentColor;
          ctx.shadowBlur = 6;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(ast.x, ast.y, ast.size, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        });

        // Draw Spaceship in Center
        ctx.save();
        ctx.translate(150, 130);
        ctx.rotate(playerAngle.current);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(11, 0);
        ctx.lineTo(-9, -7);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-9, 7);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Draw Bullets
        ctx.fillStyle = '#ec4899';
        bullets.current.forEach(b => {
          ctx.beginPath();
          ctx.arc(b.x, b.y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // ------------------------------------
      // MODE: CENTIPEDE RETRO SHOOTER
      // ------------------------------------
      else if (game.id === 'centipede_retro') {
        // Player moves left/right at bottom
        if (controlType === 'cursor') {
          headPos.current.x = Math.max(15, Math.min(285, pointerPos.current.x));
        } else {
          if (joyActiveRef.current) {
            headPos.current.x = Math.max(15, Math.min(285, headPos.current.x + joyOffsetRef.current.x * 3.5));
          }
        }

        // Auto-shoot bullets up
        if (Math.random() < 0.12 && bullets.current.length < 4) {
          bullets.current.push({ x: headPos.current.x, y: 230, vx: 0, vy: -5.5 });
        }

        // Update bullets
        bullets.current.forEach((b, bIdx) => {
          b.y += b.vy;
          if (b.y < 0) bullets.current.splice(bIdx, 1);
        });

        // Update & Render centipede
        let allDead = true;
        let changeDir = false;
        centipedeSegments.current.forEach(seg => {
          if (seg.y > 0) {
            allDead = false;
            seg.x += seg.vx;
            if (seg.x < 10 || seg.x > 290) {
              changeDir = true;
            }
          }
        });

        if (changeDir) {
          centipedeSegments.current.forEach(seg => {
            if (seg.y > 0) {
              seg.vx = -seg.vx;
              seg.y += 18;
              if (seg.y > 220) {
                setGameOver(true);
                triggerNotification('CENTIPEDE INVASION', 'The cyber centipede reached bottom bunkers.');
              }
            }
          });
        }

        // Collision Checks
        centipedeSegments.current.forEach(seg => {
          if (seg.y <= 0) return;
          
          // Bullet hit
          bullets.current.forEach((b, bIdx) => {
            if (Math.hypot(b.x - seg.x, b.y - seg.y) < 11) {
              bullets.current.splice(bIdx, 1);
              seg.y = -999; // mark dead
              setScore(s => s + 50);
              onEarnGold(Math.floor(15 * game.multiplier));
              createSparks(seg.x, seg.y, '#10b981', 12);
            }
          });

          // Crash player
          if (Math.hypot(headPos.current.x - seg.x, 240 - seg.y) < 14) {
            setGameOver(true);
            triggerNotification('HULL COLLAPSED', 'Crashed into a crawling centipede node.');
          }
        });

        // Draw Player
        ctx.fillStyle = game.themeColor;
        ctx.shadowColor = game.accentColor;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(headPos.current.x, 230);
        ctx.lineTo(headPos.current.x - 10, 245);
        ctx.lineTo(headPos.current.x + 10, 245);
        ctx.closePath();
        ctx.fill();

        // Draw Bullets
        ctx.fillStyle = '#ec4899';
        bullets.current.forEach(b => {
          ctx.fillRect(b.x - 1.5, b.y, 3, 7);
        });

        // Draw Centipede Segments
        centipedeSegments.current.forEach((seg, sIdx) => {
          if (seg.y <= 0) return;
          ctx.fillStyle = sIdx === 0 ? '#10b981' : '#22c55e';
          ctx.beginPath();
          ctx.arc(seg.x, seg.y, 7.5, 0, Math.PI * 2);
          ctx.fill();
          // little eyes on head
          if (sIdx === 0) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(seg.x - 3, seg.y - 3, 2, 2);
            ctx.fillRect(seg.x + 1, seg.y - 3, 2, 2);
          }
        });

        if (allDead) {
          // Respawn level
          setScore(s => s + 500);
          onEarnGold(Math.floor(100 * game.multiplier));
          triggerNotification('GRID DECONTAMINATED', 'All centipede nodes eradicated. Regenerating next sector.');
          centipedeSegments.current = Array(10).fill(null).map((_, i) => ({
            x: 40 + i * 18,
            y: 40,
            vx: 2.0
          }));
        }
      }

      // ------------------------------------
      // MODE: BREAKOUT BRICK CRUSHER
      // ------------------------------------
      else if (game.id === 'breakout_brick') {
        // Paddle position
        if (controlType === 'cursor') {
          headPos.current.x = Math.max(25, Math.min(275, pointerPos.current.x));
        } else {
          if (joyActiveRef.current) {
            headPos.current.x = Math.max(25, Math.min(275, headPos.current.x + joyOffsetRef.current.x * 4));
          }
        }

        // Update ball physics
        ball.current.x += ball.current.vx;
        ball.current.y += ball.current.vy;

        // Wall collisions
        if (ball.current.x < 6 || ball.current.x > 294) {
          ball.current.vx = -ball.current.vx;
        }
        if (ball.current.y < 6) {
          ball.current.vy = -ball.current.vy;
        }

        // Bottom floor (Game over)
        if (ball.current.y > 256) {
          setGameOver(true);
          triggerNotification('KINETIC LOSS', 'The tracking ball fell below the core threshold.');
        }

        // Paddle hit
        if (ball.current.y > 244 && ball.current.y < 249) {
          if (ball.current.x > headPos.current.x - 25 && ball.current.x < headPos.current.x + 25) {
            ball.current.vy = -Math.abs(ball.current.vy);
            // shift angle slightly depending on hit offset
            const offset = (ball.current.x - headPos.current.x) / 25;
            ball.current.vx = offset * 2.5;
          }
        }

        // Brick hits
        let bricksLeft = false;
        breakoutBricks.current.forEach(br => {
          if (!br.active) return;
          bricksLeft = true;

          if (ball.current.x > br.x && ball.current.x < br.x + br.w) {
            if (ball.current.y > br.y && ball.current.y < br.y + br.h) {
              br.active = false;
              ball.current.vy = -ball.current.vy;
              setScore(s => s + 40);
              onEarnGold(Math.floor(10 * game.multiplier));
              createSparks(br.x + br.w/2, br.y + br.h/2, br.color, 10);
            }
          }
        });

        // Draw Paddle
        ctx.fillStyle = game.themeColor;
        ctx.fillRect(headPos.current.x - 25, 245, 50, 8);

        // Draw Ball
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ball.current.x, ball.current.y, 5, 0, Math.PI * 2);
        ctx.fill();

        // Draw Bricks
        breakoutBricks.current.forEach(br => {
          if (!br.active) return;
          ctx.fillStyle = br.color;
          ctx.fillRect(br.x, br.y, br.w, br.h);
        });

        if (!bricksLeft) {
          setScore(s => s + 800);
          onEarnGold(Math.floor(150 * game.multiplier));
          triggerNotification('ALL BRICKS ERADICATED', 'Arena cleared! Proceeding to next level.');
          // reset bricks
          breakoutBricks.current.forEach(b => b.active = true);
          ball.current = { x: 150, y: 150, vx: 2.2, vy: -2.2 };
        }
      }

      // ------------------------------------
      // MODE: FROGGER HIGHWAY CROSSING
      // ------------------------------------
      else if (game.id === 'frogger_cross') {
        // Simple directional controls
        if (controlType === 'cursor') {
          headPos.current.x = Math.max(10, Math.min(290, pointerPos.current.x));
          headPos.current.y = Math.max(10, Math.min(290, pointerPos.current.y));
        } else {
          if (joyActiveRef.current) {
            headPos.current.x = Math.max(10, Math.min(290, headPos.current.x + joyOffsetRef.current.x * 3));
            headPos.current.y = Math.max(10, Math.min(290, headPos.current.y + joyOffsetRef.current.y * 3));
          }
        }

        // Update horizontal vehicles
        froggerCars.current.forEach(car => {
          car.x += car.vx;
          if (car.vx > 0 && car.x > 300) car.x = -car.w;
          if (car.vx < 0 && car.x < -car.w) car.x = 300;

          // Collision with player
          const px = headPos.current.x;
          const py = headPos.current.y;
          if (px > car.x && px < car.x + car.w && py > car.y && py < car.y + car.h) {
            setGameOver(true);
            triggerNotification('GRID CRASH', 'Flattened by moving high-velocity packet vehicle.');
          }

          // Draw Vehicle
          ctx.fillStyle = car.color;
          ctx.fillRect(car.x, car.y, car.w, car.h);
          // wheels
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(car.x + 2, car.y - 2, 6, 2);
          ctx.fillRect(car.x + car.w - 8, car.y - 2, 6, 2);
        });

        // Draw Lanes/Roads
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 80); ctx.lineTo(300, 80);
        ctx.moveTo(0, 130); ctx.lineTo(300, 130);
        ctx.moveTo(0, 180); ctx.lineTo(300, 180);
        ctx.stroke();

        // Goal Check
        if (headPos.current.y < 35) {
          setScore(s => s + 200);
          onEarnGold(Math.floor(40 * game.multiplier));
          triggerNotification('DESTINATION REACHED', 'Crossed high-velocity traffic safely! Sector complete.');
          headPos.current = { x: 150, y: 260 };
        }

        // Draw Player (Frog)
        ctx.fillStyle = '#22c55e';
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(headPos.current.x, headPos.current.y, 6.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // ------------------------------------
      // MODE: DONKEY KONG RETRO
      // ------------------------------------
      else if (game.id === 'donkey_kong_retro') {
        // Controls
        let dx = 0;
        let dy = 0;
        if (controlType === 'cursor') {
          dx = (pointerPos.current.x - headPos.current.x) * 0.1;
        } else {
          if (joyActiveRef.current) {
            dx = joyOffsetRef.current.x * 2.5;
            dy = joyOffsetRef.current.y * 2.5;
          }
        }

        headPos.current.x = Math.max(10, Math.min(290, headPos.current.x + dx));

        // Stepped Scaffolds logic
        const py = headPos.current.y;
        // Gravity effect
        let onGround = false;
        const platforms = [75, 135, 195, 255];
        platforms.forEach(plat => {
          if (Math.abs(py - plat) < 4) {
            onGround = true;
          }
        });

        if (!onGround && py < 255) {
          headPos.current.y = Math.min(255, headPos.current.y + 1.8);
        }

        // Climb / Jump simulation if moving up
        if (dy < -0.8 && onGround) {
          headPos.current.y -= 35; // hop up or climb
        }

        // Update barrels
        dkBarrels.current.forEach((bar, bIdx) => {
          bar.x += bar.vx;
          if (bar.vx > 0 && bar.x > 280) {
            bar.vx = -bar.vx;
            bar.y += 60; // drop a level
          }
          if (bar.vx < 0 && bar.x < 20) {
            bar.vx = -bar.vx;
            bar.y += 60; // drop a level
          }
          if (bar.y > 260) {
            // recycle
            bar.y = 70;
            bar.x = 260;
          }

          // Crash check
          if (Math.hypot(headPos.current.x - bar.x, headPos.current.y - bar.y) < 12) {
            setGameOver(true);
            triggerNotification('NODE COLLISION', 'Smashed by heavy rolling data barrel.');
          }

          // Draw Barrel
          ctx.fillStyle = '#ef4444';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(bar.x, bar.y - 5, 6, 0, Math.PI * 2);
          ctx.fill();
        });

        // Draw Scaffolds
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 4;
        platforms.forEach(plat => {
          ctx.beginPath();
          ctx.moveTo(20, plat);
          ctx.lineTo(280, plat);
          ctx.stroke();
        });

        // Win check (Reach top plat)
        if (headPos.current.y < 80) {
          setScore(s => s + 350);
          onEarnGold(Math.floor(75 * game.multiplier));
          triggerNotification('ASCENT ACHIEVED', 'Reached the server top deck! Saved the glowing nodes.');
          headPos.current = { x: 40, y: 250 };
        }

        // Draw Player
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(headPos.current.x, headPos.current.y - 7, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      // ------------------------------------
      // MODE D: PAC-MAN OR CLASSIC SNAKE ENGINE
      // ------------------------------------
      else {
        // Adjust player angle toward pointer target
        if (controlType === 'cursor') {
          const targetDx = pointerPos.current.x - headPos.current.x;
          const targetDy = pointerPos.current.y - headPos.current.y;
          const dist = Math.hypot(targetDx, targetDy);
          if (dist > 5) {
            const targetAngle = Math.atan2(targetDy, targetDx);
            let diff = targetAngle - playerAngle.current;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            playerAngle.current += diff * 0.16;
          }
        } else {
          if (joyActiveRef.current && (joyOffsetRef.current.x !== 0 || joyOffsetRef.current.y !== 0)) {
            const targetAngle = Math.atan2(joyOffsetRef.current.y, joyOffsetRef.current.x);
            let diff = targetAngle - playerAngle.current;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            playerAngle.current += diff * 0.18;
          }
        }

        // Move player head
        headPos.current.x += Math.cos(playerAngle.current) * (speed * 0.75);
        headPos.current.y += Math.sin(playerAngle.current) * (speed * 0.75);

        // Wrap boundaries
        if (headPos.current.x < 0) headPos.current.x = canvas.width;
        else if (headPos.current.x > canvas.width) headPos.current.x = 0;
        if (headPos.current.y < 0) headPos.current.y = canvas.height;
        else if (headPos.current.y > canvas.height) headPos.current.y = 0;

        // Add history
        trailHistory.current.unshift({ ...headPos.current });
        if (trailHistory.current.length > lengthRef.current * 3) {
          trailHistory.current.pop();
        }

        // Collision checks (Classic snake only)
        if (game.id !== 'pac_arena') {
          const safeMargin = 12;
          for (let i = safeMargin; i < trailHistory.current.length; i += 3) {
            const seg = trailHistory.current[i];
            if (seg && Math.hypot(headPos.current.x - seg.x, headPos.current.y - seg.y) < 6) {
              setGameOver(true);
              triggerNotification('Crushed!', 'You collided with your own tail nodes.');
              return;
            }
          }

          bots.current.forEach(bot => {
            bot.history.forEach((seg, idx) => {
              if (idx > 2 && Math.hypot(headPos.current.x - seg.x, headPos.current.y - seg.y) < 7) {
                setGameOver(true);
                triggerNotification('Adversary Block!', `Crashed into the tail of ${bot.name}.`);
              }
            });
          });
        } else {
          // Pacman ghost head crash check
          bots.current.forEach(bot => {
            if (Math.hypot(headPos.current.x - bot.x, headPos.current.y - bot.y) < 12) {
              setGameOver(true);
              triggerNotification('Ghost Caught!', `Caught by ${bot.name}.`);
            }
          });
        }

        // Eat Gems
        gems.current.forEach((gem, idx) => {
          if (Math.hypot(headPos.current.x - gem.x, headPos.current.y - gem.y) < 10) {
            lengthRef.current += 1;
            setScore(s => s + gem.value);
            onEarnGold(Math.floor(gem.value * game.multiplier * 0.5));

            createSparks(gem.x, gem.y, gem.color, 12);

            // Respawn gem
            gems.current[idx] = {
              x: Math.random() * 280 + 10,
              y: Math.random() * 280 + 10,
              color: game.id === 'pac_arena' ? '#facc15' : ['#f43f5e', '#10b981', '#3b82f6', '#ea580c', '#eab308'][Math.floor(Math.random() * 5)],
              value: 15
            };
          }
        });

        // Render food pellets/gems
        gems.current.forEach(g => {
          ctx.save();
          ctx.shadowColor = g.color; ctx.shadowBlur = 6;
          ctx.fillStyle = g.color;
          ctx.beginPath();
          ctx.arc(g.x, g.y, game.id === 'pac_arena' ? 3.5 : 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });

        // RENDER PLAYER
        if (game.id === 'pac_arena') {
          // Draw Pac-man head with chomping mouth facing heading angle
          ctx.save();
          ctx.translate(headPos.current.x, headPos.current.y);
          ctx.rotate(playerAngle.current);
          ctx.fillStyle = '#facc15';
          ctx.shadowColor = '#facc15';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          const mouthAngle = 0.2 * Math.sin(Date.now() * 0.01) + 0.25;
          ctx.arc(0, 0, 8, mouthAngle, Math.PI * 2 - mouthAngle);
          ctx.lineTo(0, 0);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        } else {
          // Render classic smooth bead follow
          for (let i = lengthRef.current - 1; i >= 0; i--) {
            const histIndex = Math.min(trailHistory.current.length - 1, i * 3);
            const seg = trailHistory.current[histIndex];
            if (!seg) continue;

            ctx.save();
            ctx.fillStyle = i === 0 ? game.themeColor : game.accentColor;
            ctx.shadowColor = game.themeColor;
            ctx.shadowBlur = i === 0 ? 8 : 2;
            ctx.beginPath();
            ctx.arc(seg.x, seg.y, i === 0 ? 6.5 : 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }

        // UPDATE & RENDER BOTS / GHOSTS
        bots.current.forEach(bot => {
          // Find closest target gem
          let closest = gems.current[0];
          let minDist = 99999;
          gems.current.forEach(g => {
            const d = Math.hypot(g.x - bot.x, g.y - bot.y);
            if (d < minDist) { minDist = d; closest = g; }
          });

          // Steer towards target
          const dx = closest.x - bot.x;
          const dy = closest.y - bot.y;
          const targetAngle = Math.atan2(dy, dx);
          let diff = targetAngle - bot.angle;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          bot.angle += diff * 0.12;

          bot.x += Math.cos(bot.angle) * (speed * 0.65);
          bot.y += Math.sin(bot.angle) * (speed * 0.65);

          if (bot.x < 0) bot.x = canvas.width;
          else if (bot.x > canvas.width) bot.x = 0;
          if (bot.y < 0) bot.y = canvas.height;
          else if (bot.y > canvas.height) bot.y = 0;

          bot.history.unshift({ x: bot.x, y: bot.y });
          if (bot.history.length > bot.length * 3) {
            bot.history.pop();
          }

          // RENDER
          if (game.id === 'pac_arena') {
            // Draw Ghost Shape
            ctx.save();
            ctx.fillStyle = bot.color;
            ctx.shadowColor = bot.color;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(bot.x, bot.y - 1, 7, Math.PI, 0, false);
            ctx.lineTo(bot.x + 7, bot.y + 7);
            // bottom wave
            ctx.lineTo(bot.x + 4, bot.y + 5);
            ctx.lineTo(bot.x + 1, bot.y + 7);
            ctx.lineTo(bot.x - 2, bot.y + 5);
            ctx.lineTo(bot.x - 5, bot.y + 7);
            ctx.lineTo(bot.x - 7, bot.y + 7);
            ctx.closePath();
            ctx.fill();

            // Eyes
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(bot.x - 2.5, bot.y - 1, 2, 0, Math.PI * 2);
            ctx.arc(bot.x + 2.5, bot.y - 1, 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#1e3a8a';
            ctx.beginPath();
            ctx.arc(bot.x - 2.5, bot.y - 1, 1, 0, Math.PI * 2);
            ctx.arc(bot.x + 2.5, bot.y - 1, 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          } else {
            // Classic bot body beads
            for (let j = bot.length - 1; j >= 0; j--) {
              const histIndex = Math.min(bot.history.length - 1, j * 3);
              const seg = bot.history[histIndex];
              if (!seg) continue;

              ctx.save();
              ctx.fillStyle = j === 0 ? bot.color : 'rgba(255,255,255,0.15)';
              ctx.beginPath();
              ctx.arc(seg.x, seg.y, j === 0 ? 5.5 : 3.8, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          }
        });
      }

      animId = requestAnimationFrame(loop);
    };

    loop();

    return () => cancelAnimationFrame(animId);
  }, [gameOver, controlType, game]);

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    pointerPos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      setControlType('joystick');
      joyActiveRef.current = true;
      let ox = 0, oy = 0;
      if (e.key === 'ArrowUp' || e.key === 'w') oy = -1;
      if (e.key === 'ArrowDown' || e.key === 's') oy = 1;
      if (e.key === 'ArrowLeft' || e.key === 'a') ox = -1;
      if (e.key === 'ArrowRight' || e.key === 'd') ox = 1;
      if (ox !== 0 || oy !== 0) {
        joyOffsetRef.current = { x: ox, y: oy };
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <div className="flex justify-between items-center w-full text-xs">
        <span className="text-emerald-400 font-bold flex items-center gap-1">
          <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
          Score: {score}
        </span>
        
        <span className="text-[10px] text-slate-400 font-mono">
          {game.id === 'galaga_cmd' || game.id === 'space_invaders' || game.id === 'asteroids_vector'
            ? 'TAP SCREEN / DRAG TO SHOOT & DESTROY TARGETS!'
            : 'DESKTOP: Mouse / Keyboard WASD • MOBILE: Joystick'}
        </span>
      </div>

      <canvas
        ref={canvasRef}
        width={300}
        height={260}
        onPointerMove={handlePointerMove}
        onPointerDown={handleCanvasClick}
        className="border border-slate-800 rounded-2xl bg-slate-950 w-full cursor-crosshair touch-none"
      />

      {gameOver ? (
        <button
          onClick={initGame}
          className="w-full py-2.5 bg-emerald-500 hover:opacity-90 text-slate-950 rounded-xl font-black text-xs uppercase"
        >
          RESPAWN SYSTEM (RETRY)
        </button>
      ) : (
        <div className="flex justify-center items-center gap-4 w-full pt-1">
          <div className="flex gap-2">
            <button 
              onClick={() => setControlType('cursor')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold ${controlType === 'cursor' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400'}`}
            >
              CURSOR FOLLOW
            </button>
            <button 
              onClick={() => setControlType('joystick')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold ${controlType === 'joystick' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400'}`}
            >
              VIRTUAL JOYPAD
            </button>
          </div>
          
          {controlType === 'joystick' && (
            <div className="grid grid-cols-3 gap-1 w-24">
              <div />
              <button onPointerDown={() => { joyActiveRef.current = true; joyOffsetRef.current = { x: 0, y: -1 }; }} className="bg-slate-800 p-1.5 text-xs rounded-lg text-white">▲</button>
              <div />
              <button onPointerDown={() => { joyActiveRef.current = true; joyOffsetRef.current = { x: -1, y: 0 }; }} className="bg-slate-800 p-1.5 text-xs rounded-lg text-white">◀</button>
              <button onPointerDown={() => { joyActiveRef.current = true; joyOffsetRef.current = { x: 0, y: 1 }; }} className="bg-slate-800 p-1.5 text-xs rounded-lg text-white">▼</button>
              <button onPointerDown={() => { joyActiveRef.current = true; joyOffsetRef.current = { x: 1, y: 0 }; }} className="bg-slate-800 p-1.5 text-xs rounded-lg text-white">▶</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// 2. DYNAMIC LOGIC PUZZLE HUB (MINESWEEPER, TETRIS, 2048, WORDLE, SUDOKU)
// ==========================================
function MinesweeperEngine({ game, onEarnGold, triggerNotification }: { game: ArcadeGame; onEarnGold: (a: number) => void; triggerNotification: any }) {
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [score, setScore] = useState(0);

  // 1. Minesweeper States
  const [size, setSize] = useState(game.settings.size || 8);
  const [grid, setGrid] = useState<{ value: string; revealed: boolean; flagged: boolean }[][]>([]);

  // 2. 2048 States
  const [grid2048, setGrid2048] = useState<number[][]>(Array(4).fill(null).map(() => Array(4).fill(0)));

  // 3. Wordle States
  const [wordleSecret] = useState(() => {
    const list = ['PROXY', 'NODE', 'ADMIN', 'CYBER', 'OASIS', 'REACT', 'SHELL', 'LOGIC', 'FRAME', 'WIDGET', 'CLOUD'];
    return list[Math.floor(Math.random() * list.length)];
  });
  const [wordleGuesses, setWordleGuesses] = useState<string[]>([]);
  const [wordleInput, setWordleInput] = useState('');

  // 4. Sudoku States
  const [sudokuGrid, setSudokuGrid] = useState<number[][]>([
    [1, 0, 3, 0],
    [0, 0, 0, 2],
    [3, 0, 0, 0],
    [0, 2, 0, 3]
  ]);
  const sudokuSolution = [
    [1, 4, 3, 2],
    [2, 3, 4, 1],
    [3, 1, 2, 4],
    [4, 2, 1, 3]
  ];

  // 5. Tetris States
  const [tetrisGrid, setTetrisGrid] = useState<string[][]>(Array(16).fill(null).map(() => Array(10).fill('')));
  const [tetrisPiece, setTetrisPiece] = useState({ x: 4, y: 0, shape: [[1, 1], [1, 1]], color: '#10b981' });

  // 6. Lights Out States
  const [lightsOutGrid, setLightsOutGrid] = useState<boolean[][]>(Array(4).fill(null).map(() => Array(4).fill(false)));

  // 7. Maze Runner States
  const [mazePlayer, setMazePlayer] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 8. Sokoban States
  const [sokobanState, setSokobanState] = useState<{ player: { x: number; y: number }; boxes: { x: number; y: number }[] }>({
    player: { x: 1, y: 1 },
    boxes: [{ x: 2, y: 2 }, { x: 3, y: 3 }]
  });

  // 9. Pipe Flow States
  const [pipeGrid, setPipeGrid] = useState<number[][]>(Array(4).fill(null).map(() => Array(4).fill(0)));

  // Init Game Routing
  const initGame = () => {
    setGameOver(false);
    setWon(false);
    setScore(0);

    if (game.id === '2048_fusion') {
      const g = Array(4).fill(null).map(() => Array(4).fill(0));
      g[Math.floor(Math.random() * 4)][Math.floor(Math.random() * 4)] = 2;
      g[Math.floor(Math.random() * 4)][Math.floor(Math.random() * 4)] = 2;
      setGrid2048(g);
    } else if (game.id === 'wordle_decoder') {
      setWordleGuesses([]);
      setWordleInput('');
    } else if (game.id === 'sudoku_matrix') {
      setSudokuGrid([
        [1, 0, 3, 0],
        [0, 0, 0, 2],
        [3, 0, 0, 0],
        [0, 2, 0, 3]
      ]);
    } else if (game.id === 'tetris_core') {
      setTetrisGrid(Array(16).fill(null).map(() => Array(10).fill('')));
      spawnTetrisPiece();
    } else if (game.id === 'lights_out_protocol') {
      const g = Array(4).fill(null).map(() => Array(4).fill(false));
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          g[r][c] = Math.random() > 0.4;
        }
      }
      g[1][1] = true;
      g[2][2] = true;
      setLightsOutGrid(g);
    } else if (game.id === 'maze_runner_logic') {
      setMazePlayer({ x: 0, y: 0 });
    } else if (game.id === 'sokoban_logistics') {
      setSokobanState({
        player: { x: 1, y: 1 },
        boxes: [{ x: 2, y: 2 }, { x: 3, y: 3 }]
      });
    } else if (game.id === 'pipe_flow_grid') {
      setPipeGrid([
        [0, 90, 180, 270],
        [90, 180, 270, 0],
        [180, 270, 0, 90],
        [270, 0, 90, 180]
      ]);
    } else {
      // Minesweeper
      const s = game.settings.size || 8;
      const bombs = game.settings.density || 10;
      setSize(s);

      const temp = Array(s).fill(null).map(() =>
        Array(s).fill(null).map(() => ({ value: '0', revealed: false, flagged: false }))
      );

      let placed = 0;
      while (placed < bombs) {
        const r = Math.floor(Math.random() * s);
        const c = Math.floor(Math.random() * s);
        if (temp[r][c].value !== 'M') {
          temp[r][c].value = 'M';
          placed++;
        }
      }

      for (let r = 0; r < s; r++) {
        for (let c = 0; c < s; c++) {
          if (temp[r][c].value === 'M') continue;
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < s && nc >= 0 && nc < s && temp[nr][nc].value === 'M') {
                count++;
              }
            }
          }
          temp[r][c].value = count.toString();
        }
      }
      setGrid(temp);
    }
  };

  useEffect(() => {
    initGame();
  }, [game]);

  // ==========================================
  // MINESWEEPER LOGIC
  // ==========================================
  const revealCell = (r: number, c: number) => {
    if (gameOver || won || grid[r][c].flagged || grid[r][c].revealed) return;
    const updated = [...grid.map(row => row.map(cell => ({ ...cell })))];

    if (updated[r][c].value === 'M') {
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          if (updated[i][j].value === 'M') updated[i][j].revealed = true;
        }
      }
      setGrid(updated);
      setGameOver(true);
      triggerNotification('BOOM!', 'Grid probe hit deep mining trap.');
      return;
    }

    const flood = (row: number, col: number) => {
      if (row < 0 || row >= size || col < 0 || col >= size || updated[row][col].revealed || updated[row][col].flagged) return;
      updated[row][col].revealed = true;
      if (updated[row][col].value === '0') {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            flood(row + dr, col + dc);
          }
        }
      }
    };

    flood(r, c);

    let left = 0;
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (updated[i][j].value !== 'M' && !updated[i][j].revealed) left++;
      }
    }

    setGrid(updated);
    if (left === 0) {
      setWon(true);
      const payout = Math.floor(1800 * game.multiplier);
      onEarnGold(payout);
      triggerNotification('Solved!', `Grid decrypted successfully! +$${payout} Gold.`);
    }
  };

  const flagCell = (e: any, r: number, c: number) => {
    e.preventDefault();
    if (gameOver || won || grid[r][c].revealed) return;
    const updated = [...grid.map(row => row.map(cell => ({ ...cell })))];
    updated[r][c].flagged = !updated[r][c].flagged;
    setGrid(updated);
  };

  // ==========================================
  // 2048 LOGIC
  // ==========================================
  const handle2048Move = (dir: 'U' | 'D' | 'L' | 'R') => {
    if (gameOver || won) return;
    let current = grid2048.map(row => [...row]);
    let moved = false;

    const rotate = (m: number[][]) => {
      let r = Array(4).fill(null).map(() => Array(4).fill(0));
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          r[j][3 - i] = m[i][j];
        }
      }
      return r;
    };

    // Standard Slide Left logic
    const slideLeft = (matrix: number[][]) => {
      for (let r = 0; r < 4; r++) {
        let row = matrix[r].filter(v => v !== 0);
        for (let i = 0; i < row.length - 1; i++) {
          if (row[i] === row[i + 1]) {
            row[i] *= 2;
            setScore(s => s + row[i]);
            onEarnGold(Math.floor(row[i] * 0.1));
            row.splice(i + 1, 1);
          }
        }
        while (row.length < 4) row.push(0);
        if (JSON.stringify(matrix[r]) !== JSON.stringify(row)) {
          moved = true;
        }
        matrix[r] = row;
      }
    };

    if (dir === 'L') {
      slideLeft(current);
    } else if (dir === 'R') {
      current = current.map(row => row.reverse());
      slideLeft(current);
      current = current.map(row => row.reverse());
    } else if (dir === 'U') {
      current = rotate(rotate(rotate(current)));
      slideLeft(current);
      current = rotate(current);
    } else if (dir === 'D') {
      current = rotate(current);
      slideLeft(current);
      current = rotate(rotate(rotate(current)));
    }

    if (moved) {
      // Spawn extra item
      let empties: { r: number; c: number }[] = [];
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (current[r][c] === 0) empties.push({ r, c });
        }
      }
      if (empties.length > 0) {
        const spot = empties[Math.floor(Math.random() * empties.length)];
        current[spot.r][spot.c] = Math.random() < 0.9 ? 2 : 4;
      }

      setGrid2048(current);

      // Check max win
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (current[r][c] === 2048) {
            setWon(true);
            onEarnGold(Math.floor(2500 * game.multiplier));
            triggerNotification('MAX MERGE', 'Achieved 2048 quantum block state!');
          }
        }
      }

      // Check board lock
      let lock = true;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (current[r][c] === 0) lock = false;
          if (r < 3 && current[r][c] === current[r + 1][c]) lock = false;
          if (c < 3 && current[r][c] === current[r][c + 1]) lock = false;
        }
      }
      if (lock) setGameOver(true);
    }
  };

  // ==========================================
  // WORDLE LOGIC
  // ==========================================
  const handleWordleSubmit = () => {
    if (gameOver || won) return;
    const guess = wordleInput.toUpperCase().trim();
    if (guess.length !== 5 && wordleSecret.length === 5) {
      triggerNotification('Format Alert', 'Guess must be exactly 5 characters.');
      return;
    }
    if (guess.length !== 4 && wordleSecret.length === 4) {
      triggerNotification('Format Alert', 'Guess must be exactly 4 characters.');
      return;
    }

    const updated = [...wordleGuesses, guess];
    setWordleGuesses(updated);
    setWordleInput('');

    if (guess === wordleSecret) {
      setWon(true);
      const payout = Math.floor(1500 * game.multiplier);
      onEarnGold(payout);
      triggerNotification('ACCESS GRANTED', `Decoded secret string '${wordleSecret}' perfectly!`);
    } else if (updated.length >= 6) {
      setGameOver(true);
      triggerNotification('DECRYPTION FAILURE', `Secret string was: ${wordleSecret}`);
    }
  };

  // ==========================================
  // SUDOKU LOGIC
  // ==========================================
  const cycleSudokuCell = (r: number, c: number) => {
    if (won || [ [1,0,3,0],[0,0,0,2],[3,0,0,0],[0,2,0,3] ][r][c] !== 0) return;
    const temp = sudokuGrid.map(row => [...row]);
    temp[r][c] = temp[r][c] === 4 ? 0 : temp[r][c] + 1;
    setSudokuGrid(temp);

    // Auto verification
    let isSame = true;
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (temp[i][j] !== sudokuSolution[i][j]) isSame = false;
      }
    }
    if (isSame) {
      setWon(true);
      onEarnGold(Math.floor(1600 * game.multiplier));
      triggerNotification('GRID ALIGNED', 'Sudoku matrix aligned flawlessly.');
    }
  };

  // ==========================================
  // TETRIS LOGIC
  // ==========================================
  const spawnTetrisPiece = () => {
    const shapes = [
      [[1, 1], [1, 1]], // O
      [[1, 1, 1, 1]], // I
      [[0, 1, 0], [1, 1, 1]], // T
      [[1, 1, 0], [0, 1, 1]], // Z
      [[0, 1, 1], [1, 1, 0]]  // S
    ];
    const colors = ['#f43f5e', '#3b82f6', '#10b981', '#ea580c', '#ec4899'];
    const idx = Math.floor(Math.random() * shapes.length);
    setTetrisPiece({
      x: 4,
      y: 0,
      shape: shapes[idx],
      color: colors[idx]
    });
  };

  const handleTetrisMove = (dx: number, dy: number) => {
    if (gameOver || won) return;
    // Collision check helper
    const checkCollision = (px: number, py: number, shape: number[][]) => {
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c] === 1) {
            const tx = px + c;
            const ty = py + r;
            if (tx < 0 || tx >= 10 || ty >= 16) return true;
            if (ty >= 0 && tetrisGrid[ty][tx] !== '') return true;
          }
        }
      }
      return false;
    };

    if (!checkCollision(tetrisPiece.x + dx, tetrisPiece.y + dy, tetrisPiece.shape)) {
      setTetrisPiece(p => ({ ...p, x: p.x + dx, y: p.y + dy }));
    } else if (dy > 0) {
      // Lock piece in place
      const gridTemp = tetrisGrid.map(row => [...row]);
      for (let r = 0; r < tetrisPiece.shape.length; r++) {
        for (let c = 0; c < tetrisPiece.shape[r].length; c++) {
          if (tetrisPiece.shape[r][c] === 1) {
            const ty = tetrisPiece.y + r;
            const tx = tetrisPiece.x + c;
            if (ty < 0) {
              setGameOver(true);
              return;
            }
            gridTemp[ty][tx] = tetrisPiece.color;
          }
        }
      }

      // Clear rows
      let lines = 0;
      const filteredGrid = gridTemp.filter(row => {
        const isFull = row.every(cell => cell !== '');
        if (isFull) lines++;
        return !isFull;
      });
      while (filteredGrid.length < 16) {
        filteredGrid.unshift(Array(10).fill(''));
      }

      if (lines > 0) {
        setScore(s => s + lines * 100);
        onEarnGold(Math.floor(lines * 50 * game.multiplier));
      }

      setTetrisGrid(filteredGrid);
      spawnTetrisPiece();
    }
  };

  const rotateTetrisPiece = () => {
    const s = tetrisPiece.shape;
    const n = s[0].length;
    const m = s.length;
    let r = Array(n).fill(null).map(() => Array(m).fill(0));
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        r[j][m - 1 - i] = s[i][j];
      }
    }
    // check fit
    setTetrisPiece(p => ({ ...p, shape: r }));
  };

  // Tetris gravity loop
  useEffect(() => {
    if (game.id !== 'tetris_core' || gameOver || won) return;
    const interval = setInterval(() => {
      handleTetrisMove(0, 1);
    }, 800);
    return () => clearInterval(interval);
  }, [game.id, tetrisPiece, tetrisGrid, gameOver]);

  // Lights Out Action
  const toggleLightsOut = (r: number, c: number) => {
    if (won || gameOver) return;
    const g = lightsOutGrid.map(row => [...row]);
    const dirs = [[0,0], [-1,0], [1,0], [0,-1], [0,1]];
    dirs.forEach(([dr, dc]) => {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < 4 && nc >= 0 && nc < 4) {
        g[nr][nc] = !g[nr][nc];
      }
    });
    setLightsOutGrid(g);
    
    const isAllOff = g.every(row => row.every(cell => !cell));
    if (isAllOff) {
      setWon(true);
      const payout = Math.floor(1500 * game.multiplier);
      onEarnGold(payout);
      triggerNotification('PROTOCOL RESOLVED', `All lights extinguished! Earned $${payout} Gold.`);
    }
  };

  // Maze Runner Layout & Action
  const mazeLayout = [
    [0, 0, 1, 0, 0, 0, 0, 0],
    [1, 0, 1, 0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1, 0, 0, 0],
    [1, 1, 1, 0, 1, 0, 1, 1],
    [0, 0, 0, 0, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 0, 1, 0],
    [0, 0, 0, 1, 0, 0, 0, 0],
    [1, 1, 0, 0, 0, 1, 1, 0]
  ];

  const moveMazePlayer = (dx: number, dy: number) => {
    if (won || gameOver) return;
    const nx = mazePlayer.x + dx;
    const ny = mazePlayer.y + dy;
    if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
      if (mazeLayout[ny][nx] === 0) {
        setMazePlayer({ x: nx, y: ny });
        if (nx === 7 && ny === 7) {
          setWon(true);
          const payout = Math.floor(1600 * game.multiplier);
          onEarnGold(payout);
          triggerNotification('MAZE DECRYPTED', `You escaped the blind sector! Earned $${payout} Gold.`);
        }
      }
    }
  };

  // Sokoban Action
  const moveSokoban = (dx: number, dy: number) => {
    if (won || gameOver) return;
    const { player, boxes } = sokobanState;
    const px = player.x + dx;
    const py = player.y + dy;
    
    if (px < 1 || px > 4 || py < 1 || py > 4) return;
    
    const boxIdx = boxes.findIndex(b => b.x === px && b.y === py);
    if (boxIdx !== -1) {
      const nextBoxX = px + dx;
      const nextBoxY = py + dy;
      
      if (nextBoxX < 1 || nextBoxX > 4 || nextBoxY < 1 || nextBoxY > 4) return;
      const otherBox = boxes.some(b => b.x === nextBoxX && b.y === nextBoxY);
      if (otherBox) return;
      
      const updatedBoxes = boxes.map((b, idx) => idx === boxIdx ? { x: nextBoxX, y: nextBoxY } : b);
      setSokobanState({
        player: { x: px, y: py },
        boxes: updatedBoxes
      });
      
      const goals = [{ x: 3, y: 2 }, { x: 2, y: 4 }];
      const allOnGoals = updatedBoxes.every(b => goals.some(g => g.x === b.x && g.y === b.y));
      if (allOnGoals) {
        setWon(true);
        const payout = Math.floor(1800 * game.multiplier);
        onEarnGold(payout);
        triggerNotification('LOGISTICS SOLVED', `All power cells secured! Earned $${payout} Gold.`);
      }
    } else {
      setSokobanState({
        player: { x: px, y: py },
        boxes
      });
    }
  };

  // Pipe Flow Action
  const rotatePipe = (r: number, c: number) => {
    if (won || gameOver) return;
    const temp = pipeGrid.map(row => [...row]);
    temp[r][c] = (temp[r][c] + 90) % 360;
    setPipeGrid(temp);
    
    const totalSum = temp.reduce((sum, row) => sum + row.reduce((s, val) => s + val, 0), 0);
    if (totalSum % 360 === 0) {
      setWon(true);
      const payout = Math.floor(1500 * game.multiplier);
      onEarnGold(payout);
      triggerNotification('PIPE SYSTEM RESTORED', `Circuit connection complete! Earned $${payout} Gold.`);
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* ------------------------------------
          2048 INTERFACE
          ------------------------------------ */}
      {game.id === '2048_fusion' && (
        <div className="flex flex-col items-center gap-3">
          <div className="text-xs font-mono text-slate-400">
            Combine matching values to achieve 2048 block merge!
          </div>
          <div className="text-emerald-400 font-bold text-xs">SCORE: {score}</div>
          <div className="grid grid-cols-4 gap-2 bg-slate-900 p-3 rounded-2xl border border-slate-800 w-64 h-64">
            {grid2048.map((row, r) =>
              row.map((val, c) => (
                <div
                  key={`${r}-${c}`}
                  className="rounded-xl flex items-center justify-center font-black text-sm transition-all"
                  style={{
                    backgroundColor: val === 0 ? '#0b0f19' : game.themeColor + '30',
                    color: val === 0 ? '#334155' : '#ffffff',
                    border: val === 0 ? '1px solid #1e293b' : `1px solid ${game.themeColor}`
                  }}
                >
                  {val > 0 ? val : ''}
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => handle2048Move('U')} className="px-3 py-1.5 bg-slate-800 text-xs text-white rounded-lg">▲ UP</button>
            <button onClick={() => handle2048Move('D')} className="px-3 py-1.5 bg-slate-800 text-xs text-white rounded-lg">▼ DOWN</button>
            <button onClick={() => handle2048Move('L')} className="px-3 py-1.5 bg-slate-800 text-xs text-white rounded-lg">◀ LEFT</button>
            <button onClick={() => handle2048Move('R')} className="px-3 py-1.5 bg-slate-800 text-xs text-white rounded-lg">RIGHT ▶</button>
          </div>
        </div>
      )}

      {/* ------------------------------------
          WORDLE DECODER INTERFACE
          ------------------------------------ */}
      {game.id === 'wordle_decoder' && (
        <div className="flex flex-col items-center gap-4">
          <div className="text-xs font-mono text-slate-400">
            DECRYPT {wordleSecret.length}-LETTER QUANTUM PASSCODE
          </div>
          
          <div className="grid gap-1.5">
            {Array(6).fill(null).map((_, r) => {
              const guess = wordleGuesses[r] || '';
              return (
                <div key={r} className="flex gap-1.5">
                  {Array(wordleSecret.length).fill(null).map((_, c) => {
                    const char = guess[c] || '';
                    let colorBg = 'bg-slate-950 border-slate-800 text-white';
                    if (guess) {
                      if (wordleSecret[c] === char) colorBg = 'bg-emerald-500 border-emerald-400 text-slate-950';
                      else if (wordleSecret.includes(char)) colorBg = 'bg-amber-500 border-amber-400 text-slate-950';
                      else colorBg = 'bg-slate-800 border-slate-700 text-slate-500';
                    }
                    return (
                      <div
                        key={c}
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center text-sm font-black uppercase transition-all ${colorBg}`}
                      >
                        {char}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 w-full max-w-xs">
            <input
              type="text"
              maxLength={wordleSecret.length}
              value={wordleInput}
              onChange={(e) => setWordleInput(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
              placeholder="ENTER VECTOR..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white text-center focus:outline-none focus:border-emerald-500 uppercase"
              onKeyDown={(e) => e.key === 'Enter' && handleWordleSubmit()}
            />
            <button
              onClick={handleWordleSubmit}
              className="px-4 py-2 bg-emerald-500 text-slate-950 hover:bg-emerald-400 text-xs font-bold rounded-xl"
            >
              GUESS
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------
          SUDOKU INTERFACE
          ------------------------------------ */}
      {game.id === 'sudoku_matrix' && (
        <div className="flex flex-col items-center gap-3">
          <div className="text-xs font-mono text-slate-400">
            Tap empty cells to cycle 1-4 and satisfy Sudoku grid!
          </div>
          <div className="grid grid-cols-4 gap-2 bg-slate-900 p-4 rounded-2xl border border-slate-800">
            {sudokuGrid.map((row, r) =>
              row.map((val, c) => {
                const isOriginal = [ [1,0,3,0],[0,0,0,2],[3,0,0,0],[0,2,0,3] ][r][c] !== 0;
                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => cycleSudokuCell(r, c)}
                    disabled={isOriginal}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm border cursor-pointer transition-all ${
                      isOriginal
                        ? 'bg-slate-950 border-slate-800 text-slate-400'
                        : val > 0
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                        : 'bg-slate-800 border-slate-700 text-transparent hover:border-slate-500'
                    }`}
                  >
                    {val > 0 ? val : ''}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------
          TETRIS INTERFACE
          ------------------------------------ */}
      {game.id === 'tetris_core' && (
        <div className="flex flex-col items-center gap-3">
          <div className="text-emerald-400 font-bold text-xs">SCORE: {score}</div>
          <div className="relative border border-slate-800 rounded-2xl bg-slate-950 w-[180px] h-[288px] overflow-hidden p-1 flex flex-wrap gap-[1px]">
            {Array(16).fill(null).map((_, r) =>
              Array(10).fill(null).map((_, c) => {
                // Determine if this contains the current active falling piece
                let activeColor = '';
                const { shape, x: px, y: py, color: pColor } = tetrisPiece;
                for (let row = 0; row < shape.length; row++) {
                  for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col] === 1 && py + row === r && px + col === c) {
                      activeColor = pColor;
                    }
                  }
                }

                const lockedColor = tetrisGrid[r]?.[c] || '';
                const finalColor = activeColor || lockedColor || '#0a0d16';

                return (
                  <div
                    key={`${r}-${c}`}
                    className="w-4 h-4 rounded-[2px]"
                    style={{
                      backgroundColor: finalColor,
                      border: finalColor === '#0a0d16' ? 'none' : '1px solid rgba(255,255,255,0.15)'
                    }}
                  />
                );
              })
            )}
          </div>

          <div className="flex gap-2.5">
            <button onClick={() => handleTetrisMove(-1, 0)} className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold text-[10px] rounded-lg">◀ LEFT</button>
            <button onClick={rotateTetrisPiece} className="px-3 py-1.5 bg-emerald-500 text-slate-950 font-bold text-[10px] rounded-lg">↻ ROTATE</button>
            <button onClick={() => handleTetrisMove(1, 0)} className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold text-[10px] rounded-lg">RIGHT ▶</button>
            <button onClick={() => handleTetrisMove(0, 1)} className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold text-[10px] rounded-lg">▼ DROP</button>
          </div>
        </div>
      )}

      {/* ------------------------------------
          MINESWEEPER INTERFACE (DEFAULT)
          ------------------------------------ */}
      {game.id !== '2048_fusion' && 
       game.id !== 'wordle_decoder' && 
       game.id !== 'sudoku_matrix' && 
       game.id !== 'tetris_core' && 
       game.id !== 'lights_out_protocol' &&
       game.id !== 'maze_runner_logic' &&
       game.id !== 'sokoban_logistics' &&
       game.id !== 'pipe_flow_grid' && (
        <div className="flex flex-col items-center gap-3">
          <div className="text-xs font-mono text-slate-400">
            Left-click to reveal • Right-click / Tap-Hold to Flag
          </div>

          <div
            className="grid gap-1 bg-slate-900 p-3 rounded-2xl border border-slate-850"
            style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
          >
            {grid.map((row, r) =>
              row.map((cell, c) => (
                <button
                  key={`${r}-${c}`}
                  onClick={() => revealCell(r, c)}
                  onContextMenu={(e) => flagCell(e, r, c)}
                  className={`w-7 h-7 rounded-lg font-black text-[10px] flex items-center justify-center transition-all cursor-pointer select-none ${
                    cell.revealed
                      ? cell.value === 'M'
                        ? 'bg-red-500 text-white'
                        : 'bg-slate-950 text-slate-400'
                      : cell.flagged
                      ? 'bg-amber-500/20 border border-amber-500 text-amber-400'
                      : 'bg-slate-800 text-slate-500 hover:bg-slate-750'
                  }`}
                >
                  {cell.revealed
                    ? cell.value === 'M' ? '💣' : cell.value === '0' ? '' : cell.value
                    : cell.flagged ? '🚩' : ''}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------
          LIGHTS OUT INTERFACE
          ------------------------------------ */}
      {game.id === 'lights_out_protocol' && (
        <div className="flex flex-col items-center gap-3">
          <div className="text-xs font-mono text-slate-400">
            Click switches to turn off all tiles! Toggling a tile flips its neighbors.
          </div>
          <div className="grid grid-cols-4 gap-2.5 bg-slate-900 p-4 rounded-2xl border border-slate-800">
            {lightsOutGrid.map((row, r) =>
              row.map((cell, c) => (
                <button
                  key={`${r}-${c}`}
                  onClick={() => toggleLightsOut(r, c)}
                  className={`w-11 h-11 rounded-xl cursor-pointer transition-all border ${
                    cell 
                      ? 'bg-yellow-400 border-yellow-300 shadow-[0_0_12px_#facc15]' 
                      : 'bg-slate-950 border-slate-850'
                  }`}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------
          MAZE RUNNER INTERFACE
          ------------------------------------ */}
      {game.id === 'maze_runner_logic' && (
        <div className="flex flex-col items-center gap-3">
          <div className="text-xs font-mono text-slate-400 text-center">
            Steer the Green Sphere to the Red Escape Block!
          </div>
          <div className="grid grid-cols-8 gap-0.5 bg-slate-900 p-2 rounded-2xl border border-slate-800">
            {mazeLayout.map((row, r) =>
              row.map((val, c) => {
                const isPlayer = mazePlayer.x === c && mazePlayer.y === r;
                const isExit = c === 7 && r === 7;
                return (
                  <div
                    key={`${r}-${c}`}
                    className="w-6 h-6 rounded flex items-center justify-center font-bold text-[8px]"
                    style={{
                      backgroundColor: isPlayer 
                        ? '#10b981' 
                        : isExit 
                        ? '#ef4444' 
                        : val === 1 
                        ? '#1e293b' 
                        : '#0b0f19',
                      boxShadow: isPlayer ? '0 0 8px #10b981' : isExit ? '0 0 8px #ef4444' : 'none'
                    }}
                  >
                    {isPlayer ? '●' : isExit ? 'Exit' : ''}
                  </div>
                );
              })
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => moveMazePlayer(0, -1)} className="px-3 py-1 bg-slate-800 text-xs text-white rounded">▲</button>
            <button onClick={() => moveMazePlayer(0, 1)} className="px-3 py-1 bg-slate-800 text-xs text-white rounded">▼</button>
            <button onClick={() => moveMazePlayer(-1, 0)} className="px-3 py-1 bg-slate-800 text-xs text-white rounded">◀</button>
            <button onClick={() => moveMazePlayer(1, 0)} className="px-3 py-1 bg-slate-800 text-xs text-white rounded">▶</button>
          </div>
        </div>
      )}

      {/* ------------------------------------
          SOKOBAN INTERFACE
          ------------------------------------ */}
      {game.id === 'sokoban_logistics' && (
        <div className="flex flex-col items-center gap-3">
          <div className="text-xs font-mono text-slate-400 text-center">
            Push Blue Power Cells (📦) onto Target Glow Squares (🎯)!
          </div>
          <div className="grid grid-cols-6 gap-1 bg-slate-900 p-2 rounded-2xl border border-slate-800">
            {Array(6).fill(null).map((_, r) =>
              Array(6).fill(null).map((_, c) => {
                const isWall = r === 0 || r === 5 || c === 0 || c === 5;
                const isGoal = (r === 2 && c === 3) || (r === 4 && c === 2);
                const isPlayer = sokobanState.player.x === c && sokobanState.player.y === r;
                const isBox = sokobanState.boxes.some(b => b.x === c && b.y === r);
                
                let bg = '#0b0f19';
                if (isWall) bg = '#1e293b';
                else if (isPlayer) bg = '#a855f7';
                else if (isBox) bg = isGoal ? '#10b981' : '#3b82f6';
                else if (isGoal) bg = '#ea580c30';

                return (
                  <div
                    key={`${r}-${c}`}
                    className="w-8 h-8 rounded flex items-center justify-center font-bold text-xs"
                    style={{
                      backgroundColor: bg,
                      border: isGoal ? '1px dashed #ea580c' : 'none'
                    }}
                  >
                    {isPlayer ? '🤖' : isBox ? '📦' : isGoal ? '🎯' : ''}
                  </div>
                );
              })
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => moveSokoban(0, -1)} className="px-3 py-1 bg-slate-800 text-xs text-white rounded">▲</button>
            <button onClick={() => moveSokoban(0, 1)} className="px-3 py-1 bg-slate-800 text-xs text-white rounded">▼</button>
            <button onClick={() => moveSokoban(-1, 0)} className="px-3 py-1 bg-slate-800 text-xs text-white rounded">◀</button>
            <button onClick={() => moveSokoban(1, 0)} className="px-3 py-1 bg-slate-800 text-xs text-white rounded">▶</button>
          </div>
        </div>
      )}

      {/* ------------------------------------
          PIPE FLOW INTERFACE
          ------------------------------------ */}
      {game.id === 'pipe_flow_grid' && (
        <div className="flex flex-col items-center gap-3">
          <div className="text-xs font-mono text-slate-400 text-center">
            Tap pipe segments to rotate. Align total loop connections!
          </div>
          <div className="grid grid-cols-4 gap-2.5 bg-slate-900 p-4 rounded-2xl border border-slate-800">
            {pipeGrid.map((row, r) =>
              row.map((deg, c) => (
                <button
                  key={`${r}-${c}`}
                  onClick={() => rotatePipe(r, c)}
                  className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-500 flex items-center justify-center text-lg text-cyan-400 transition-all"
                  style={{ transform: `rotate(${deg}deg)` }}
                >
                  {(r+c) % 2 === 0 ? '║' : '╔'}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Master reset state bar */}
      {(gameOver || won) ? (
        <div className="flex flex-col items-center gap-2 pt-1 w-full max-w-xs">
          <div className={`text-sm font-black uppercase text-center ${won ? 'text-emerald-400' : 'text-rose-500'}`}>
            {won ? 'SOLVED SUCCESSFULLY!' : 'SESSION TERMINATED!'}
          </div>
          <button
            onClick={initGame}
            className="w-full py-2 bg-emerald-500 hover:opacity-95 text-slate-950 text-xs font-black rounded-xl uppercase"
          >
            PLAY AGAIN
          </button>
        </div>
      ) : (
        <button onClick={initGame} className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs rounded-xl font-bold">
          REINITIALIZE GRID
        </button>
      )}
    </div>
  );
}

// ==========================================
// 3. DYNAMIC PRO SPORTS HUB (ARCHERY, GOLF, BASKETBALL, HOCKEY)
// ==========================================
function ArcheryEngine({ game, onEarnGold, triggerNotification }: { game: ArcadeGame; onEarnGold: (a: number) => void; triggerNotification: any }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pull, setPull] = useState(0);
  const [streak, setStreak] = useState(0);

  // Ball/Arrow vectors
  const arrow = useRef({ x: 40, y: 130, vx: 0, vy: 0 });
  const isFlying = useRef(false);
  const targetY = useRef(100);
  const targetDir = useRef(1);
  const isPulling = useRef(false);
  const startDrag = useRef({ x: 0, y: 0 });

  // Physics constraints
  const gravity = game.settings.gravity || 0.15;
  const wind = useRef(0);

  const initTurn = () => {
    isFlying.current = false;
    if (game.id === 'retro_golf_swing') {
      arrow.current = { x: 30, y: 155, vx: 0, vy: 0 };
    } else if (game.id === 'pixel_basketball') {
      arrow.current = { x: 40, y: 150, vx: 0, vy: 0 };
    } else if (game.id === 'neon_hockey' || game.id === 'cyber_tennis') {
      arrow.current = { x: 30, y: 90, vx: 0, vy: 0 };
    } else {
      // Archery
      arrow.current = { x: 40, y: 130, vx: 0, vy: 0 };
    }
    wind.current = (Math.random() - 0.5) * 4 * (game.settings.windChance || 0.5);
  };

  useEffect(() => {
    initTurn();
    setStreak(0);
  }, [game]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let id: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Deep sky gradient
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#0a0d1d');
      grad.addColorStop(1, '#1d1135');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Wind or Level text
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = '9px monospace';
      if (game.id === 'retro_golf_swing') {
        ctx.fillText('PAR 1 • DRAG BACK & FLING INTO HOLE', 10, 15);
      } else if (game.id === 'pixel_basketball') {
        ctx.fillText('FREE THROW SHOOTOUT • SWISH IT IN!', 10, 15);
      } else if (game.id === 'neon_hockey' || game.id === 'cyber_tennis') {
        ctx.fillText('RALLY STREAK CHALLENGE • SLIP IT PAST GOALIE', 10, 15);
      } else {
        ctx.fillText(`WIND: ${wind.current.toFixed(1)} KTS ${wind.current >= 0 ? '▶' : '◀'}`, 10, 15);
      }
      ctx.restore();

      // Move general target / goalie Y
      const tSpeed = (game.settings.speed || 4.5) * 0.4;
      targetY.current += targetDir.current * tSpeed;
      if (targetY.current < 20 || targetY.current > canvas.height - 30) {
        targetDir.current *= -1;
      }

      // ------------------------------------
      // MODE A: RETRO GOLF SWING
      // ------------------------------------
      if (game.id === 'retro_golf_swing') {
        // Draw green grass hill
        ctx.fillStyle = '#10b981';
        ctx.fillRect(0, 160, canvas.width, 20);

        // Draw sand trap
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(130, 160, 40, 5);

        // Draw cup flag stick
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(260, 160);
        ctx.lineTo(260, 115);
        ctx.stroke();

        // Red triangle flag
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(260, 115);
        ctx.lineTo(245, 122);
        ctx.lineTo(260, 130);
        ctx.fill();

        // Sim flight / roll
        if (isFlying.current) {
          arrow.current.x += arrow.current.vx;
          arrow.current.y += arrow.current.vy;

          if (arrow.current.y < 155) {
            arrow.current.vy += gravity * 0.7; // golf ball gravity
          } else {
            // Roll on grass with friction
            arrow.current.y = 155;
            arrow.current.vy = 0;
            arrow.current.vx *= 0.94; // friction
          }

          // Draw golf ball
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(arrow.current.x, arrow.current.y, 4, 0, Math.PI * 2);
          ctx.fill();

          // Check win (cup range is 255 - 265)
          if (arrow.current.x >= 254 && arrow.current.x <= 266 && arrow.current.y >= 152) {
            setStreak(s => s + 1);
            const payout = Math.floor(100 * game.multiplier);
            onEarnGold(payout);
            triggerNotification('HOLE IN ONE!', `Fantastic putt! Earned $${payout} Gold.`);
            initTurn();
          }

          // Out of bounds / stop rolling
          if (Math.abs(arrow.current.vx) < 0.08 || arrow.current.x > canvas.width || arrow.current.x < 0) {
            if (Math.abs(arrow.current.vx) < 0.08) {
              setStreak(0);
              triggerNotification('SANDED', 'Ball stopped short of the cup.');
            }
            initTurn();
          }
        }
      }

      // ------------------------------------
      // MODE B: PIXEL BASKETBALL SHOOTOUT
      // ------------------------------------
      else if (game.id === 'pixel_basketball') {
        // Draw Hoop & net on right
        ctx.save();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(240, 75);
        ctx.lineTo(260, 75); // Hoop ring
        ctx.stroke();

        // White backboard
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(260, 50, 2, 40);

        // Net strings
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(242, 75);
        ctx.lineTo(247, 95);
        ctx.lineTo(252, 95);
        ctx.lineTo(258, 75);
        ctx.stroke();
        ctx.restore();

        // Sim basketball flight
        if (isFlying.current) {
          arrow.current.x += arrow.current.vx;
          arrow.current.y += arrow.current.vy;
          arrow.current.vy += gravity * 0.85; // ball gravity

          // Draw orange basketball with black ribbing lines
          ctx.save();
          ctx.fillStyle = '#ea580c';
          ctx.shadowColor = '#ea580c';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(arrow.current.x, arrow.current.y, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Hit ring checking (pass through hoop area [240-260] at y = 75 descending)
          if (arrow.current.x >= 238 && arrow.current.x <= 262 &&
              arrow.current.y >= 70 && arrow.current.y <= 82 && arrow.current.vy > 0) {
            setStreak(s => s + 1);
            const payout = Math.floor(120 * game.multiplier);
            onEarnGold(payout);
            triggerNotification('SWISH!', `Unstoppable double-rim swish! Earned $${payout} Gold.`);
            initTurn();
          }

          // Landed/Miss
          if (arrow.current.x > canvas.width || arrow.current.y > canvas.height) {
            setStreak(0);
            triggerNotification('AIRBALL', 'Missed the backboard plane completely.');
            initTurn();
          }
        }
      }

      // ------------------------------------
      // MODE C: NEON HOCKEY / TENNIS PADDLE RALLY
      // ------------------------------------
      else if (game.id === 'neon_hockey' || game.id === 'cyber_tennis') {
        // Draw Opponent Paddle (Goalie)
        ctx.save();
        ctx.fillStyle = game.themeColor;
        ctx.shadowColor = game.accentColor;
        ctx.shadowBlur = 8;
        ctx.fillRect(270, targetY.current - 20, 8, 40);
        ctx.restore();

        // Sim Puck Flight
        if (isFlying.current) {
          arrow.current.x += arrow.current.vx;
          arrow.current.y += arrow.current.vy;

          // Bounce ceiling/floor
          if (arrow.current.y < 8 || arrow.current.y > canvas.height - 8) {
            arrow.current.vy *= -1;
          }

          // Draw Neon Puck
          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#60a5fa';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(arrow.current.x, arrow.current.y, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Check block by goalie
          if (arrow.current.x >= 266 && arrow.current.x <= 276) {
            if (arrow.current.y >= targetY.current - 20 && arrow.current.y <= targetY.current + 20) {
              setStreak(0);
              triggerNotification('BLOCKED', 'Goalie intercepted puck trajectory.');
              initTurn();
            }
          }

          // Goal/Point scored!
          if (arrow.current.x > 290) {
            setStreak(s => s + 1);
            const payout = Math.floor(150 * game.multiplier);
            onEarnGold(payout);
            triggerNotification('GOAL!', `Goal achieved! High velocity puck bypass. Earned $${payout} Gold.`);
            initTurn();
          }

          // Miss left
          if (arrow.current.x < 0) {
            setStreak(0);
            initTurn();
          }
        }
      }

      // ------------------------------------
      // MODE D: CLASSIC ARCHERY TARGET PROTOCOL
      // ------------------------------------
      else {
        // Draw Target rings
        ctx.save();
        const tx = canvas.width - 30;
        const ty = targetY.current;
        const rings = [15, 10, 5];
        const colors = ['#ef4444', '#3b82f6', '#fbbf24'];
        rings.forEach((r, idx) => {
          ctx.beginPath();
          ctx.arc(tx, ty, r, 0, Math.PI * 2);
          ctx.fillStyle = colors[idx];
          ctx.shadowColor = colors[idx];
          ctx.shadowBlur = 4;
          ctx.fill();
        });
        ctx.restore();

        // Projectile trajectory simulation
        if (isFlying.current) {
          arrow.current.x += arrow.current.vx;
          arrow.current.y += arrow.current.vy;
          arrow.current.vy += gravity; 
          arrow.current.vx += wind.current * 0.008; 

          // Draw arrow vector
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(arrow.current.x, arrow.current.y);
          ctx.lineTo(arrow.current.x - arrow.current.vx * 1.5, arrow.current.y - arrow.current.vy * 1.5);
          ctx.stroke();

          // Target Hit logic
          if (arrow.current.x >= tx - 4 && arrow.current.x <= tx + 10) {
            const dy = Math.abs(arrow.current.y - ty);
            if (dy < 18) {
              let scorePct = 100 - Math.floor(dy * 5);
              scorePct = Math.max(20, scorePct);

              setStreak(s => s + 1);
              const payout = Math.floor(scorePct * game.multiplier * 0.5);
              onEarnGold(payout);
              triggerNotification('BULLSEYE!', `Hit accuracy measured at ${scorePct}%. Yield: $${payout} Gold.`);
              initTurn();
            }
          }

          // Clear target plane miss
          if (arrow.current.x > canvas.width || arrow.current.y > canvas.height || arrow.current.y < 0) {
            setStreak(0);
            triggerNotification('MISS', 'Your projectile node cleared the target plane.');
            initTurn();
          }
        }
      }

      // Draw pull catapult bow line
      if (isPulling.current) {
        ctx.save();
        ctx.strokeStyle = game.themeColor;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        if (game.id === 'retro_golf_swing') {
          ctx.arc(30, 155, 18, -Math.PI/3, Math.PI/3);
        } else if (game.id === 'pixel_basketball') {
          ctx.arc(40, 150, 18, -Math.PI/3, Math.PI/3);
        } else if (game.id === 'neon_hockey' || game.id === 'cyber_tennis') {
          ctx.arc(30, 90, 18, -Math.PI/3, Math.PI/3);
        } else {
          ctx.arc(40, 130, 20, -Math.PI/3, Math.PI/3);
        }
        ctx.stroke();
        ctx.restore();
      }

      id = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(id);
  }, [game]);

  const handleDragStart = (e: any) => {
    isPulling.current = true;
    startDrag.current = { x: e.clientX || e.touches?.[0]?.clientX, y: e.clientY || e.touches?.[0]?.clientY };
  };

  const handleDragMove = (e: any) => {
    if (!isPulling.current) return;
    const cx = e.clientX || e.touches?.[0]?.clientX;
    const cy = e.clientY || e.touches?.[0]?.clientY;
    const dx = cx - startDrag.current.x;
    const dy = cy - startDrag.current.y;
    const power = Math.min(100, Math.round(Math.hypot(dx, dy) * 0.8));
    setPull(power);
  };

  const handleDragEnd = () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    const powerVal = pull || 40;
    if (game.id === 'retro_golf_swing') {
      arrow.current.vx = (powerVal * 0.1) + 1.5;
      arrow.current.vy = -(powerVal * 0.04);
    } else if (game.id === 'pixel_basketball') {
      arrow.current.vx = (powerVal * 0.09) + 1.8;
      arrow.current.vy = -(powerVal * 0.12) - 1.5;
    } else if (game.id === 'neon_hockey' || game.id === 'cyber_tennis') {
      arrow.current.vx = (powerVal * 0.15) + 2.5;
      arrow.current.vy = (Math.random() - 0.5) * (powerVal * 0.08);
    } else {
      arrow.current.vx = (powerVal * 0.12) + 2;
      arrow.current.vy = -(powerVal * 0.05);
    }
    isFlying.current = true;
    setPull(0);
  };

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <div className="flex justify-between items-center w-full text-xs">
        <span className="text-amber-500 font-bold font-mono">Streak: {streak}x</span>
        <span className="text-slate-400">Click/Touch & Drag Left to Fire!</span>
      </div>

      <canvas
        ref={canvasRef}
        width={300}
        height={180}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
        className="border border-slate-800 rounded-2xl bg-slate-950 w-full touch-none cursor-crosshair"
      />

      <div className="text-xs font-mono">
        LAUNCH FORCE: <span className="text-emerald-400 font-black">{pull}%</span>
      </div>
    </div>
  );
}

// ==========================================
// 4. CHESS / CHECKERS ENGINE (AI COMBAT ENGINE)
// ==========================================
function ChessCheckersEngine({ game, onEarnGold, triggerNotification }: { game: ArcadeGame; onEarnGold: (a: number) => void; triggerNotification: any }) {
  const [boardType, setBoardType] = useState<'checkers' | 'chess'>('checkers');
  const [board, setBoard] = useState<string[][]>([]);
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);

  const initBoard = (type: 'checkers' | 'chess') => {
    setBoardType(type);
    setSelected(null);

    const temp = Array(8).fill(null).map(() => Array(8).fill(''));

    if (type === 'checkers') {
      // red pieces top, blue bottom
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 8; c++) {
          if ((r + c) % 2 === 1) temp[r][c] = 'r';
        }
      }
      for (let r = 5; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if ((r + c) % 2 === 1) temp[r][c] = 'b';
        }
      }
    } else {
      // simplified chess setup
      const pieces = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
      temp[0] = pieces.map(p => p.toUpperCase()); // Bot Red
      temp[1] = Array(8).fill('P');
      temp[6] = Array(8).fill('p');
      temp[7] = pieces.map(p => p.toLowerCase()); // Player Blue
    }
    setBoard(temp);
  };

  useEffect(() => {
    initBoard(game.id.includes('chess') ? 'chess' : 'checkers');
  }, [game]);

  const selectCell = (r: number, c: number) => {
    if (!selected) {
      if (board[r][c] === '') return;
      // Blue matches lowercase (player)
      if (board[r][c] === board[r][c].toLowerCase()) {
        setSelected({ r, c });
      }
    } else {
      // Execute move
      const updated = [...board.map(row => [...row])];
      const piece = updated[selected.r][selected.c];
      
      // Perform move and clear old space
      updated[r][c] = piece;
      updated[selected.r][selected.c] = '';

      // Simple checkers jump clear
      if (boardType === 'checkers' && Math.abs(r - selected.r) === 2) {
        const mr = (r + selected.r) / 2;
        const mc = (c + selected.c) / 2;
        updated[mr][mc] = '';
      }

      setBoard(updated);
      setSelected(null);

      // Trigger AI retaliation move
      setTimeout(() => {
        aiMove(updated);
      }, 600);
    }
  };

  // Bot logic
  const aiMove = (currentBoard: string[][]) => {
    const updated = [...currentBoard.map(row => [...row])];
    
    // Find all red pieces (uppercase)
    const pieces: { r: number; c: number }[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = updated[r][c];
        if (cell !== '' && cell === cell.toUpperCase()) {
          pieces.push({ r, c });
        }
      }
    }

    if (pieces.length === 0) {
      triggerNotification('Victory!', 'All hostiles neutralized. Yield: $1,200 Gold.');
      onEarnGold(Math.floor(1200 * game.multiplier));
      return;
    }

    // Move first available piece forward
    let moved = false;
    for (const p of pieces) {
      const targetR = p.r + 1;
      const targetsC = [p.c - 1, p.c + 1];
      for (const tc of targetsC) {
        if (targetR < 8 && tc >= 0 && tc < 8 && updated[targetR][tc] === '') {
          updated[targetR][tc] = updated[p.r][p.c];
          updated[p.r][p.c] = '';
          moved = true;
          break;
        }
      }
      if (moved) break;
    }

    setBoard(updated);
  };

  return (
    <div className="w-full flex flex-col items-center gap-4 max-w-xs">
      <div className="flex gap-2 bg-slate-900 p-0.5 rounded-xl border border-slate-800">
        <button onClick={() => initBoard('checkers')} className={`px-3 py-1 rounded-lg text-[10px] font-bold ${boardType === 'checkers' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}`}>CHECKERS</button>
        <button onClick={() => initBoard('chess')} className={`px-3 py-1 rounded-lg text-[10px] font-bold ${boardType === 'chess' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}`}>CHESS</button>
      </div>

      <div className="grid grid-cols-8 gap-0.5 bg-slate-900 p-2 rounded-2xl border border-slate-850">
        {board.map((row, r) =>
          row.map((cell, c) => {
            const isBlack = (r + c) % 2 === 1;
            const isSelected = selected?.r === r && selected?.c === c;
            return (
              <div
                key={`${r}-${c}`}
                onClick={() => selectCell(r, c)}
                className={`w-8 h-8 flex items-center justify-center cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-emerald-500/30 ring-2 ring-emerald-400'
                    : isBlack ? 'bg-slate-950 hover:bg-slate-800/40' : 'bg-slate-800/40 hover:bg-slate-800/40'
                }`}
              >
                {/* Piece Render */}
                {boardType === 'checkers' && cell !== '' && (
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${cell === 'r' ? 'bg-red-500 border-red-300' : 'bg-blue-500 border-blue-300'}`} />
                )}

                {boardType === 'chess' && cell !== '' && (
                  <span className={`text-sm font-bold ${cell === cell.toUpperCase() ? 'text-red-400' : 'text-blue-400'}`}>
                    {cell.toLowerCase() === 'p' ? '♟' : '♜'}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      <button onClick={() => initBoard(boardType)} className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-xs rounded-xl border border-slate-800 font-bold">
        RESET BOARD
      </button>
    </div>
  );
}

// ==========================================
// 5. RACING 2D MOMENTUM CAR ENGINE
// ==========================================
function RacingEngine({ game, onEarnGold, triggerNotification }: { game: ArcadeGame; onEarnGold: (a: number) => void; triggerNotification: any }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(5);
  const [racing, setRacing] = useState(false);

  // Road offsets
  const racerX = useRef(150);
  const obstacles = useRef<{ x: number; y: number }[]>([]);
  const boosters = useRef<{ x: number; y: number }[]>([]);

  const startRace = () => {
    setDistance(0);
    setSpeed(game.settings.speed || 6.5);
    racerX.current = 150;
    obstacles.current = [];
    boosters.current = [];
    setRacing(true);
    triggerNotification('Green Light!', 'Engines armed. Drifting loops active!');
  };

  useEffect(() => {
    startRace();
  }, [game]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let id: number;

    const render = () => {
      if (!racing) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw highway track borders
      ctx.fillStyle = '#060814';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Track highway lanes
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 4;
      ctx.setLineDash([20, 15]);
      ctx.beginPath();
      ctx.moveTo(100, 0); ctx.lineTo(100, canvas.height);
      ctx.moveTo(200, 0); ctx.lineTo(200, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Move player vehicle
      setDistance(d => {
        const next = d + speed * 0.15;
        if (next >= 400) {
          setRacing(false);
          const payout = Math.floor(2500 * game.multiplier);
          onEarnGold(payout);
          triggerNotification('Placing: 1st!', `Circuit complete! Awarded $${payout} Gold.`);
        }
        return next;
      });

      // Spawn hazards
      if (obstacles.current.length < 2 && Math.random() < 0.04) {
        obstacles.current.push({
          x: Math.random() * 200 + 50,
          y: -20
        });
      }

      // Move hazards
      obstacles.current.forEach((obs, idx) => {
        obs.y += speed * 0.8;
        if (obs.y > canvas.height) {
          obstacles.current.splice(idx, 1);
        }

        // Draw hazard
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 4;
        ctx.fillRect(obs.x, obs.y, 20, 10);

        // Crash detection
        if (Math.abs(obs.x - racerX.current) < 22 && Math.abs(obs.y - 200) < 18) {
          setSpeed(s => Math.max(2, s - 2));
          obstacles.current.splice(idx, 1);
          triggerNotification('IMPACT', 'Collided with hazard. Kinetic friction applied.');
        }
      });

      // Draw player hovercraft (Neon styled)
      ctx.save();
      ctx.fillStyle = game.themeColor;
      ctx.shadowColor = game.accentColor;
      ctx.shadowBlur = 10;
      ctx.fillRect(racerX.current - 12, 200, 24, 16);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(racerX.current - 8, 202, 16, 4); // wind shield
      ctx.restore();

      id = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(id);
  }, [racing, speed, game]);

  const steer = (dir: 'L' | 'R') => {
    racerX.current = Math.max(60, Math.min(240, racerX.current + (dir === 'L' ? -25 : 25)));
  };

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <div className="flex justify-between items-center w-full text-xs font-mono text-slate-400">
        <span>Distance: {Math.floor(distance)} / 400m</span>
        <span className="text-emerald-400 font-bold">Velocity: {Math.floor(speed * 20)} KM/H</span>
      </div>

      <canvas
        ref={canvasRef}
        width={300}
        height={240}
        className="border border-slate-800 rounded-2xl bg-slate-950 w-full"
      />

      <div className="flex gap-4 w-full justify-between pt-1">
        <button
          onClick={() => steer('L')}
          className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-xs font-bold border border-slate-800 cursor-pointer"
        >
          ◀ STEER LEFT
        </button>
        <button
          onClick={() => steer('R')}
          className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-xs font-bold border border-slate-800 cursor-pointer"
        >
          STEER RIGHT ▶
        </button>
      </div>
    </div>
  );
}

function FidgetEngine({ game, onEarnGold, triggerNotification }: { game: ArcadeGame; onEarnGold: (a: number) => void; triggerNotification: any }) {
  const [pops, setPops] = useState(0);

  const interact = () => {
    setPops(p => p + 1);
    onEarnGold(0.5 * game.multiplier);
    
    // Play sound
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        
        if (game.id.includes('fighter') || game.id.includes('kombat')) {
          osc.type = 'square';
          osc.frequency.setValueAtTime(150 + Math.random() * 50, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1);
        } else {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1200 + Math.random() * 400, ctx.currentTime);
        }
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch (err) {}
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-slate-900 rounded-2xl relative overflow-hidden">
      <div className="absolute top-4 left-4 text-xs font-bold text-slate-500">
        INTERACTIONS: <span className="text-white">{pops}</span>
      </div>
      
      <div className="text-center mb-8 max-w-sm px-4">
        <h3 className="text-2xl font-black text-white mb-2">{game.name}</h3>
        <p className="text-sm text-slate-400">{game.description}</p>
      </div>

      <button
        onClick={interact}
        className="w-48 h-48 rounded-full border-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] active:scale-90 transition-all flex items-center justify-center cursor-pointer select-none"
        style={{ borderColor: game.themeColor, backgroundColor: game.accentColor + '40' }}
      >
        <span className="text-3xl font-black" style={{ color: game.themeColor }}>
          {game.id.includes('fighter') || game.id.includes('kombat') ? 'PUNCH!' : 'POP!'}
        </span>
      </button>
    </div>
  );
}
