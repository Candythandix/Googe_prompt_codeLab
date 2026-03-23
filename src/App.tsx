import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Music, Trophy, RefreshCw, Gamepad2, Activity, Award, Power } from 'lucide-react';

// --- Types ---
interface Point {
  x: number;
  y: number;
}

interface Track {
  id: number;
  title: string;
  artist: string;
  url: string;
  cover: string;
}

// --- Constants ---
const GRID_SIZE = 20;
const INITIAL_SNAKE: Point[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION: Point = { x: 0, y: -1 };
const GAME_SPEED = 80;
const TRAIL_LENGTH = 5;

const TRACKS: Track[] = [
  {
    id: 1,
    title: "Neon Pulse",
    artist: "AI Synthwave",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    cover: "https://picsum.photos/seed/neon1/400/400"
  },
  {
    id: 2,
    title: "Cyber Drift",
    artist: "Digital Dreams",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    cover: "https://picsum.photos/seed/neon2/400/400"
  },
  {
    id: 3,
    title: "Midnight Grid",
    artist: "Retro Future",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    cover: "https://picsum.photos/seed/neon3/400/400"
  }
];

export default function App() {
  // --- Music Player State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- Snake Game State ---
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [trail, setTrail] = useState<Point[]>([]);
  const gameLoopRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  // --- Music Logic ---
  const currentTrack = TRACKS[currentTrackIndex];

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const skipForward = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setProgress(0);
  };

  const skipBackward = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setProgress(0);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      setProgress((current / duration) * 100);
    }
  };

  // --- Snake Logic ---
  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood: Point;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setTrail([]);
    setDirection(INITIAL_DIRECTION);
    setFood(generateFood(INITIAL_SNAKE));
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  };

  const moveSnake = useCallback(() => {
    if (gameOver || !gameStarted) return;

    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const newHead = {
        x: (head.x + direction.x + GRID_SIZE) % GRID_SIZE,
        y: (head.y + direction.y + GRID_SIZE) % GRID_SIZE,
      };

      // Collision with self
      if (prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameOver(true);
        setGameStarted(false);
        if (score > highScore) setHighScore(score);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check if food eaten
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore((s) => s + 10);
        setFood(generateFood(newSnake));
      } else {
        const tail = newSnake.pop();
        if (tail) {
          setTrail(prev => [tail, ...prev].slice(0, TRAIL_LENGTH));
        }
      }

      return newSnake;
    });
  }, [direction, food, gameOver, gameStarted, generateFood, score, highScore]);

  const gameLoop = useCallback((time: number) => {
    if (time - lastUpdateTimeRef.current > GAME_SPEED) {
      moveSnake();
      lastUpdateTimeRef.current = time;
    }
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [moveSnake]);

  useEffect(() => {
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameLoop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted && e.key === 'Enter') {
        resetGame();
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
          if (direction.y !== 1) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
          if (direction.y !== -1) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
          if (direction.x !== 1) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
          if (direction.x !== -1) setDirection({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, gameStarted]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 font-sans selection:bg-magenta-custom/30 crt">
      <div className="noise" />
      
      {/* Background Grid */}
      <div className="fixed inset-0 pointer-events-none pixel-grid opacity-20" />

      <div className="z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Panel: LOG_DATA */}
        <div className="lg:col-span-3 space-y-6 order-2 lg:order-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-black border-2 border-cyan-custom p-6 rounded-none neon-border-cyan tear-effect"
          >
            <div className="flex items-center gap-3 mb-6">
              <Activity className="text-cyan-custom w-5 h-5" />
              <h2 className="font-display text-xs tracking-widest uppercase text-cyan-custom glitch-heavy" data-text="LOG_DATA">LOG_DATA</h2>
            </div>
            <div className="space-y-8">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-cyan-custom text-[10px] uppercase tracking-[0.2em]">SESSION_VAL</span>
                </div>
                <span className="score-digital neon-text-cyan glitch-heavy" data-text={score}>{score}</span>
              </div>
              <div className="h-0.5 bg-cyan-custom/20" />
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-magenta-custom text-[10px] uppercase tracking-[0.2em]">MAX_THRESHOLD</span>
                </div>
                <span className="score-digital neon-text-magenta glitch-heavy" data-text={highScore}>{highScore}</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-black border-2 border-magenta-custom p-6 rounded-none neon-border-magenta"
          >
            <div className="flex items-center gap-3 mb-4">
              <Gamepad2 className="text-magenta-custom w-5 h-5" />
              <h2 className="font-display text-xs tracking-widest uppercase text-magenta-custom glitch-heavy" data-text="INPUT_MAP">INPUT_MAP</h2>
            </div>
            <ul className="space-y-2 text-xs text-magenta-custom/70 uppercase tracking-wider">
              <li className="flex justify-between"><span>VEC_MOVE</span> <span className="text-magenta-custom">ARROWS</span></li>
              <li className="flex justify-between"><span>SYS_INIT</span> <span className="text-magenta-custom">ENTER</span></li>
              <li className="flex justify-between"><span>FRQ_SYNC</span> <span className="text-magenta-custom">SPACE</span></li>
            </ul>
          </motion.div>
        </div>

        {/* Center Panel: CORE_PROCESS */}
        <div className="lg:col-span-6 order-1 lg:order-2">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative aspect-square bg-black rounded-none border-4 border-cyan-custom overflow-hidden group shadow-[0_0_20px_rgba(0,255,255,0.3)]"
          >
            {/* Game Grid */}
            <div 
              className="absolute inset-0 grid p-4"
              style={{ 
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
                gap: '1px'
              }}
            >
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                const x = i % GRID_SIZE;
                const y = Math.floor(i / GRID_SIZE);
                const isSnake = snake.some(s => s.x === x && s.y === y);
                const isHead = snake[0].x === x && snake[0].y === y;
                const isFood = food.x === x && food.y === y;
                const trailIndex = trail.findIndex(t => t.x === x && t.y === y);
                const isTrail = trailIndex !== -1;

                return (
                  <div 
                    key={i}
                    className={`transition-all duration-100 ${
                      isHead ? 'bg-cyan-custom shadow-[0_0_10px_#00ffff] z-10' :
                      isSnake ? 'bg-cyan-custom/60' :
                      isFood ? 'bg-magenta-custom shadow-[0_0_15px_#ff00ff] animate-pulse' :
                      isTrail ? 'bg-cyan-custom/20' :
                      'bg-cyan-custom/5'
                    }`}
                    style={isTrail ? { opacity: 1 - (trailIndex / TRAIL_LENGTH) } : {}}
                  />
                );
              })}
            </div>

            {/* Overlays */}
            <AnimatePresence>
              {!gameStarted && !gameOver && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-8 text-center"
                >
                  <h1 className="text-4xl font-display mb-4 tracking-tighter neon-text-cyan glitch-heavy" data-text="NEON_SNAKE_V2.5">NEON_SNAKE_V2.5</h1>
                  <p className="text-cyan-custom/60 mb-8 max-w-xs uppercase text-[10px] tracking-[0.3em]">EXECUTE_PROTOCOL: NAVIGATE. CONSUME. PERSIST.</p>
                  <button 
                    onClick={resetGame}
                    className="w-20 h-20 flex items-center justify-center bg-cyan-custom text-black rounded-none hover:bg-magenta-custom transition-all hover:scale-110 active:scale-95 neon-border-cyan group"
                    aria-label="INITIALIZE_SYSTEM"
                  >
                    <Power className="w-10 h-10 group-hover:animate-spin transition-all" />
                  </button>
                </motion.div>
              )}

              {gameOver && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-8 text-center"
                >
                  <h2 className="text-3xl font-display mb-2 tracking-tighter text-magenta-custom neon-text-magenta glitch-heavy" data-text="CRITICAL_FAILURE">CRITICAL_FAILURE</h2>
                  <p className="text-magenta-custom/50 mb-6 uppercase text-[10px] tracking-[0.3em]">TERMINAL_STATE: {score}</p>
                  <button 
                    onClick={resetGame}
                    className="flex items-center gap-2 px-6 py-2 bg-black text-cyan-custom font-display text-xs tracking-widest rounded-none hover:bg-cyan-custom hover:text-black transition-all border-2 border-cyan-custom neon-border-cyan"
                  >
                    <RefreshCw className="w-4 h-4" />
                    RE_BOOT
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Right Panel: AUDIO_SYNC */}
        <div className="lg:col-span-3 space-y-6 order-3">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-black border-2 border-cyan-custom p-6 rounded-none neon-border-cyan"
          >
            <div className="flex items-center gap-3 mb-6">
              <Music className="text-magenta-custom w-5 h-5" />
              <h2 className="font-display text-xs tracking-widest uppercase text-cyan-custom glitch-heavy" data-text="AUDIO_SYNC">AUDIO_SYNC</h2>
            </div>

            <div className="relative aspect-square rounded-none border border-magenta-custom/30 overflow-hidden mb-6 group">
              <img 
                src={currentTrack.cover} 
                alt={currentTrack.title}
                className={`w-full h-full object-cover grayscale contrast-150 transition-transform duration-700 ${isPlaying ? 'scale-110' : 'scale-100'}`}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-magenta-custom/20 mix-blend-overlay" />
              {isPlaying && (
                <div className="absolute bottom-4 left-4 flex gap-1 items-end h-4">
                  {[1, 2, 3, 4].map(i => (
                    <motion.div 
                      key={i}
                      animate={{ height: [2, 12, 4, 10, 2] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                      className="w-1 bg-cyan-custom"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="mb-6">
              <h3 className="font-display text-sm tracking-tight mb-1 truncate text-cyan-custom">{currentTrack.title}</h3>
              <p className="text-magenta-custom/70 text-[10px] uppercase tracking-widest truncate">{currentTrack.artist}</p>
            </div>

            {/* Controls */}
            <div className="space-y-6">
              <div className="relative h-1 bg-cyan-custom/10 rounded-none overflow-hidden">
                <motion.div 
                  className="absolute inset-y-0 left-0 bg-magenta-custom"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <button onClick={skipBackward} className="p-2 text-cyan-custom hover:text-magenta-custom transition-colors">
                  <SkipBack className="w-4 h-4" />
                </button>
                <button 
                  onClick={togglePlay}
                  className="w-12 h-12 flex items-center justify-center bg-cyan-custom text-black rounded-none hover:bg-magenta-custom transition-all active:scale-95 shadow-[0_0_10px_rgba(0,255,255,0.5)]"
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                </button>
                <button onClick={skipForward} className="p-2 text-cyan-custom hover:text-magenta-custom transition-colors">
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3 text-cyan-custom/40">
                <Volume2 className="w-3 h-3" />
                <div className="flex-1 h-0.5 bg-cyan-custom/10 rounded-none overflow-hidden">
                  <div className="h-full w-2/3 bg-cyan-custom/50" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef}
        src={currentTrack.url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={skipForward}
      />

      {/* Footer */}
      <footer className="mt-12 text-cyan-custom/30 text-[8px] uppercase tracking-[0.5em] font-display glitch-heavy" data-text="TERMINAL_v4.0.2 // PROTOCOL_NEON">
        TERMINAL_v4.0.2 // PROTOCOL_NEON
      </footer>
    </div>
  );
}
