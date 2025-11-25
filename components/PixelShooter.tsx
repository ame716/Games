import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, Player, Enemy, Bullet, Particle, PowerUp, WeaponType } from '../types';
import { GAME_WIDTH, GAME_HEIGHT, SPRITES, COLORS, BOSS_SPAWN_SCORE, POWERUP_DROP_RATE, WEAPON_STATS } from '../constants';
import { Trophy, Heart, RefreshCw, Play } from 'lucide-react';

const PixelShooter: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStateDisplay, setGameStateDisplay] = useState<{score: number; hp: number; gameOver: boolean; victory: boolean; bossSpawned: boolean}>({
    score: 0,
    hp: 100,
    gameOver: false,
    victory: false,
    bossSpawned: false
  });
  const [gameStarted, setGameStarted] = useState(false);

  // Mutable game state (Refs for performance in game loop)
  const stateRef = useRef<GameState>({
    player: { id: 0, x: GAME_WIDTH / 2, y: GAME_HEIGHT - 50, width: 28, height: 24, vx: 0, vy: 0, color: COLORS.player, hp: 100, maxHp: 100, weapon: WeaponType.DEFAULT, score: 0, dead: false, invulnerableFrames: 0, shootTimer: 0 },
    enemies: [],
    bullets: [],
    particles: [],
    powerUps: [],
    stars: [],
    score: 0,
    level: 1,
    gameOver: false,
    victory: false,
    bossSpawned: false,
    shake: 0,
    frameCount: 0
  });

  const keysRef = useRef<{ [key: string]: boolean }>({});
  const reqRef = useRef<number>(0);

  // --- Helpers ---
  const checkCollision = (a: {x: number, y: number, width: number, height: number}, b: {x: number, y: number, width: number, height: number}) => {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  };

  const spawnParticle = (x: number, y: number, color: string, count: number, speed: number = 1) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * speed + 0.5;
      stateRef.current.particles.push({
        id: Math.random(),
        x,
        y,
        width: 2,
        height: 2,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        color,
        life: 20 + Math.random() * 15,
        maxLife: 35,
        size: Math.random() * 3 + 1,
        dead: false
      });
    }
  };

  const spawnPowerUp = (x: number, y: number) => {
    const types = [WeaponType.A, WeaponType.B, WeaponType.C, WeaponType.S];
    const randomType = types[Math.floor(Math.random() * types.length)];
    stateRef.current.powerUps.push({
      id: Math.random(),
      x,
      y,
      width: 16,
      height: 16,
      vx: 0,
      vy: 1.5,
      color: COLORS[`powerUp${randomType}` as keyof typeof COLORS],
      type: randomType,
      dead: false
    });
  };

  // --- Drawing ---
  const drawSprite = (ctx: CanvasRenderingContext2D, sprite: number[][], x: number, y: number, color: string, scale: number = 4) => {
    ctx.fillStyle = color;
    for (let r = 0; r < sprite.length; r++) {
      for (let c = 0; c < sprite[r].length; c++) {
        if (sprite[r][c] === 1) {
          ctx.fillRect(Math.floor(x + c * scale), Math.floor(y + r * scale), scale, scale);
        }
      }
    }
  };

  const drawText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number = 20, color: string = 'white', align: 'center' | 'left' | 'right' = 'center') => {
    ctx.font = `${size}px "Press Start 2P", monospace`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
  };

  // --- Game Loop ---
  const update = () => {
    const state = stateRef.current;
    if (state.gameOver || state.victory) return;

    state.frameCount++;

    // 1. Player Movement
    const speed = 4;
    if (keysRef.current['ArrowLeft'] || keysRef.current['a']) state.player.x -= speed;
    if (keysRef.current['ArrowRight'] || keysRef.current['d']) state.player.x += speed;
    if (keysRef.current['ArrowUp'] || keysRef.current['w']) state.player.y -= speed;
    if (keysRef.current['ArrowDown'] || keysRef.current['s']) state.player.y += speed;

    // Clamp
    state.player.x = Math.max(0, Math.min(GAME_WIDTH - state.player.width, state.player.x));
    state.player.y = Math.max(0, Math.min(GAME_HEIGHT - state.player.height, state.player.y));

    // 2. Player Shooting
    if (state.player.shootTimer > 0) state.player.shootTimer--;
    // Auto shoot or Space
    if (state.player.shootTimer <= 0) {
      const stats = WEAPON_STATS[state.player.weapon];
      state.player.shootTimer = stats.cooldown;

      const bx = state.player.x + state.player.width / 2 - 2;
      const by = state.player.y;

      if (state.player.weapon === WeaponType.A) {
        // Spread
        state.bullets.push({ id: Math.random(), x: bx, y: by, width: 4, height: 6, vx: -1.5, vy: -stats.speed, color: COLORS.powerUpA, damage: stats.damage, owner: 'player', type: WeaponType.A, dead: false });
        state.bullets.push({ id: Math.random(), x: bx, y: by, width: 4, height: 6, vx: 0, vy: -stats.speed, color: COLORS.powerUpA, damage: stats.damage, owner: 'player', type: WeaponType.A, dead: false });
        state.bullets.push({ id: Math.random(), x: bx, y: by, width: 4, height: 6, vx: 1.5, vy: -stats.speed, color: COLORS.powerUpA, damage: stats.damage, owner: 'player', type: WeaponType.A, dead: false });
      } else if (state.player.weapon === WeaponType.C) {
        // Cannon
        state.bullets.push({ id: Math.random(), x: bx - 4, y: by, width: 12, height: 12, vx: 0, vy: -stats.speed, color: COLORS.powerUpC, damage: stats.damage, owner: 'player', type: WeaponType.C, dead: false });
      } else if (state.player.weapon === WeaponType.B) {
         // Beam
         state.bullets.push({ id: Math.random(), x: bx - 4, y: by, width: 4, height: 12, vx: 0, vy: -stats.speed, color: COLORS.powerUpB, damage: stats.damage, owner: 'player', type: WeaponType.B, dead: false });
         state.bullets.push({ id: Math.random(), x: bx + 4, y: by, width: 4, height: 12, vx: 0, vy: -stats.speed, color: COLORS.powerUpB, damage: stats.damage, owner: 'player', type: WeaponType.B, dead: false });
      } else {
        // Default & S
        state.bullets.push({ id: Math.random(), x: bx, y: by, width: 4, height: 8, vx: 0, vy: -stats.speed, color: state.player.weapon === WeaponType.S ? COLORS.powerUpS : COLORS.bulletPlayer, damage: stats.damage, owner: 'player', type: state.player.weapon, dead: false });
      }
    }

    // 3. Enemy Spawning
    if (!state.bossSpawned) {
      // Spawn enemies
      const spawnRate = Math.max(20, 60 - Math.floor(state.score / 100));
      if (state.frameCount % spawnRate === 0) {
        const x = Math.random() * (GAME_WIDTH - 30);
        const rand = Math.random();
        let type: Enemy['type'] = 'grunt';
        let hp = 20;
        let w = 28, h = 16;
        let col = COLORS.enemyGrunt;
        let scoreVal = 10;

        if (state.score > 500 && rand > 0.7) {
          type = 'fighter';
          hp = 35;
          col = COLORS.enemyFighter;
          scoreVal = 20;
        } else if (state.score > 1000 && rand > 0.9) {
          type = 'tank';
          hp = 80;
          col = COLORS.enemyTank;
          w = 30; h = 30;
          scoreVal = 50;
        }

        state.enemies.push({
          id: Math.random(),
          x, y: -40,
          width: w, height: h,
          vx: type === 'fighter' ? (Math.random() - 0.5) * 3 : 0,
          vy: type === 'tank' ? 1 : (type === 'fighter' ? 3 : 2),
          hp, maxHp: hp,
          type,
          scoreValue: scoreVal,
          shootTimer: Math.random() * 100,
          color: col,
          dead: false
        });
      }

      // Check Boss Spawn
      if (state.score >= BOSS_SPAWN_SCORE) {
        state.bossSpawned = true;
        state.enemies = []; // Clear minions
        state.enemies.push({
          id: 9999,
          x: GAME_WIDTH / 2 - 60, y: -100,
          width: 120, height: 80,
          vx: 2, vy: 1,
          hp: 3000, maxHp: 3000,
          type: 'boss',
          scoreValue: 5000,
          shootTimer: 0,
          color: COLORS.boss,
          dead: false
        });
      }
    }

    // 4. Update Entities
    // Background Stars
    if (state.stars.length < 50) {
       state.stars.push({ x: Math.random() * GAME_WIDTH, y: 0, speed: 0.5 + Math.random() * 2, brightness: Math.random() });
    }
    state.stars.forEach(s => {
      s.y += s.speed;
      if (s.y > GAME_HEIGHT) { s.y = 0; s.x = Math.random() * GAME_WIDTH; }
    });

    // Bullets
    state.bullets.forEach(b => {
      b.x += b.vx;
      b.y += b.vy;
      if (b.y < -50 || b.y > GAME_HEIGHT + 50 || b.x < -50 || b.x > GAME_WIDTH + 50) b.dead = true;
    });

    // PowerUps
    state.powerUps.forEach(p => {
      p.y += p.vy;
      if (checkCollision(state.player, p)) {
        p.dead = true;
        state.player.weapon = p.type;
        state.score += 50;
        // Floating text or effect?
      }
      if (p.y > GAME_HEIGHT) p.dead = true;
    });

    // Enemies
    state.enemies.forEach(e => {
      if (e.type === 'boss') {
        // Boss Logic
        if (e.y < 50) e.y += 1; // Entrance
        else {
          e.x += e.vx;
          if (e.x <= 0 || e.x + e.width >= GAME_WIDTH) e.vx *= -1;
        }
        
        e.shootTimer++;
        if (e.shootTimer % 40 === 0) {
            // Aimed shot
            const dx = state.player.x - e.x;
            const dy = state.player.y - e.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            state.bullets.push({
              id: Math.random(), x: e.x + e.width/2, y: e.y + e.height,
              width: 8, height: 8,
              vx: (dx/dist) * 4, vy: (dy/dist) * 4,
              damage: 15, owner: 'enemy', type: 'boss_special', color: COLORS.boss, dead: false
            });
        }
        if (e.shootTimer % 120 === 0) {
             // Spread attack
             for(let i = -2; i <= 2; i++) {
               state.bullets.push({
                id: Math.random(), x: e.x + e.width/2, y: e.y + e.height,
                width: 6, height: 6,
                vx: i * 2, vy: 4,
                damage: 10, owner: 'enemy', type: 'boss_special', color: COLORS.bulletEnemy, dead: false
               });
             }
        }

      } else {
        // Basic Enemies
        e.x += e.vx;
        e.y += e.vy;
        e.shootTimer--;
        if (e.shootTimer <= 0) {
          if (Math.random() < 0.3) {
            state.bullets.push({
              id: Math.random(), x: e.x + e.width/2, y: e.y + e.height,
              width: 6, height: 6,
              vx: 0, vy: 5,
              damage: 5, owner: 'enemy', type: 'enemy_basic', color: COLORS.bulletEnemy, dead: false
            });
          }
          e.shootTimer = 100 + Math.random() * 100;
        }
        if (e.y > GAME_HEIGHT) e.dead = true;
      }

      // Collision with Player
      if (!state.player.dead && !e.dead && checkCollision(state.player, e)) {
        if (state.player.invulnerableFrames <= 0) {
            state.player.hp -= 20;
            state.player.invulnerableFrames = 60;
            state.shake = 10;
            spawnParticle(state.player.x, state.player.y, COLORS.player, 10);
            if (e.type !== 'boss') {
                e.dead = true;
                spawnParticle(e.x, e.y, e.color, 8);
            }
        }
      }
    });

    // Bullet Collisions
    state.bullets.forEach(b => {
      if (b.dead) return;

      if (b.owner === 'player') {
        state.enemies.forEach(e => {
          if (!e.dead && checkCollision(b, e)) {
            b.dead = true;
            // Special: B type pierces? No, keep simple for now.
            e.hp -= b.damage;
            spawnParticle(b.x, b.y, '#fff', 2, 2); // Hit flash

            if (e.hp <= 0) {
              e.dead = true;
              state.score += e.scoreValue;
              state.shake = 2;
              spawnParticle(e.x + e.width/2, e.y + e.height/2, e.color, e.type === 'boss' ? 50 : 10, e.type === 'boss' ? 4 : 2);
              
              if (e.type === 'boss') {
                  state.victory = true;
              } else {
                 // PowerUp Drop 20%
                 if (Math.random() < POWERUP_DROP_RATE) {
                     spawnPowerUp(e.x, e.y);
                 }
              }
            }
          }
        });
      } else {
        if (!state.player.dead && checkCollision(b, state.player)) {
           b.dead = true;
           if (state.player.invulnerableFrames <= 0) {
               state.player.hp -= b.damage;
               state.player.invulnerableFrames = 30;
               state.shake = 5;
               spawnParticle(state.player.x, state.player.y, COLORS.player, 5);
           }
        }
      }
    });

    // Particles
    state.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) p.dead = true;
    });

    // Clean up
    state.bullets = state.bullets.filter(b => !b.dead);
    state.enemies = state.enemies.filter(e => !e.dead);
    state.particles = state.particles.filter(p => !p.dead);
    state.powerUps = state.powerUps.filter(p => !p.dead);

    if (state.player.hp <= 0) {
      state.gameOver = true;
    }
    if (state.player.invulnerableFrames > 0) state.player.invulnerableFrames--;
    if (state.shake > 0) state.shake *= 0.9;
    if (state.shake < 0.5) state.shake = 0;

    // Sync some state for React UI
    if (state.frameCount % 10 === 0) {
       setGameStateDisplay({
           score: state.score,
           hp: state.player.hp,
           gameOver: state.gameOver,
           victory: state.victory,
           bossSpawned: state.bossSpawned
       });
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = stateRef.current;
    
    // Clear and Shake
    ctx.save();
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    if (state.shake > 0) {
        const dx = (Math.random() - 0.5) * state.shake;
        const dy = (Math.random() - 0.5) * state.shake;
        ctx.translate(dx, dy);
    }

    // Stars
    ctx.fillStyle = '#ffffff';
    state.stars.forEach(s => {
        ctx.globalAlpha = s.brightness;
        ctx.fillRect(s.x, s.y, 2, 2);
    });
    ctx.globalAlpha = 1;

    // PowerUps
    state.powerUps.forEach(p => {
        drawSprite(ctx, SPRITES.POWERUP_BOX, p.x, p.y, p.color, 2);
        drawText(ctx, p.type, p.x + 8, p.y + 12, 10, 'white');
    });

    // Bullets
    state.bullets.forEach(b => {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.width, b.height);
    });

    // Enemies
    state.enemies.forEach(e => {
        let sprite = SPRITES.ENEMY_GRUNT;
        let scale = 4;
        if (e.type === 'fighter') sprite = SPRITES.ENEMY_FIGHTER;
        if (e.type === 'tank') sprite = SPRITES.ENEMY_TANK;
        if (e.type === 'boss') {
             sprite = SPRITES.BOSS;
             scale = 10;
        }
        
        // Blink white if hit (simulated simply by frame check or could add hitTimer)
        drawSprite(ctx, sprite, e.x, e.y, e.color, scale);

        // Boss Health Bar
        if (e.type === 'boss') {
            const hpPct = e.hp / e.maxHp;
            ctx.fillStyle = '#333';
            ctx.fillRect(e.x, e.y - 10, e.width, 6);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(e.x, e.y - 10, e.width * hpPct, 6);
        }
    });

    // Player
    if (!state.player.dead) {
        if (state.player.invulnerableFrames % 4 < 2) { // Flicker
            drawSprite(ctx, SPRITES.PLAYER, state.player.x, state.player.y, state.player.color, 4);
        }
    }

    // Particles
    state.particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1;

    ctx.restore();
  };

  const loop = useCallback(() => {
    if (!gameStarted) return;
    update();
    draw();
    reqRef.current = requestAnimationFrame(loop);
  }, [gameStarted]);

  useEffect(() => {
    if (gameStarted) {
        reqRef.current = requestAnimationFrame(loop);
    } else {
        cancelAnimationFrame(reqRef.current);
    }
    return () => cancelAnimationFrame(reqRef.current);
  }, [gameStarted, loop]);

  // Input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keysRef.current[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysRef.current[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const resetGame = () => {
    stateRef.current = {
        player: { id: 0, x: GAME_WIDTH / 2 - 14, y: GAME_HEIGHT - 80, width: 28, height: 24, vx: 0, vy: 0, color: COLORS.player, hp: 100, maxHp: 100, weapon: WeaponType.DEFAULT, score: 0, dead: false, invulnerableFrames: 0, shootTimer: 0 },
        enemies: [],
        bullets: [],
        particles: [],
        powerUps: [],
        stars: [],
        score: 0,
        level: 1,
        gameOver: false,
        victory: false,
        bossSpawned: false,
        shake: 0,
        frameCount: 0
    };
    setGameStateDisplay({
        score: 0,
        hp: 100,
        gameOver: false,
        victory: false,
        bossSpawned: false
    });
    setGameStarted(true);
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-zinc-900 text-white">
        {/* Scanline Container */}
        <div className="relative scanlines shadow-2xl border-4 border-zinc-800 rounded-lg overflow-hidden bg-black" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
            
            <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} className="block rendering-pixelated" style={{imageRendering: 'pixelated'}} />

            {/* HUD */}
            {gameStarted && (
                <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none">
                    <div className="flex flex-col gap-1">
                        <div className="text-yellow-400 font-bold flex items-center gap-2">
                            <Trophy size={16} />
                            <span>{gameStateDisplay.score.toString().padStart(6, '0')}</span>
                        </div>
                        {gameStateDisplay.bossSpawned && <div className="text-red-500 text-xs animate-pulse">WARNING: BOSS</div>}
                    </div>
                    <div className="flex items-center gap-1 text-red-400 font-bold">
                        <Heart size={16} fill="currentColor" />
                        <div className="w-24 h-4 bg-gray-800 border border-gray-600 relative">
                            <div className="h-full bg-red-500 transition-all duration-200" style={{width: `${Math.max(0, gameStateDisplay.hp)}%`}}></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Start Screen */}
            {!gameStarted && !gameStateDisplay.gameOver && !gameStateDisplay.victory && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-6 z-20">
                    <h1 className="text-4xl text-blue-400 mb-4 font-bold tracking-tighter uppercase">Pixel<br/>Sky Force</h1>
                    <p className="text-gray-400 text-xs mb-8 max-w-xs leading-5">
                        WASD / Arrows to Move<br/>
                        Shooting is Automatic<br/><br/>
                        Collect <span className="text-green-400">A</span> <span className="text-cyan-400">B</span> <span className="text-rose-400">C</span> <span className="text-yellow-400">S</span> Powerups!<br/><br/>
                        Boss at {BOSS_SPAWN_SCORE} Pts
                    </p>
                    <button onClick={resetGame} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded shadow-[0_4px_0_rgb(30,58,138)] active:shadow-none active:translate-y-1 transition-all flex items-center gap-2">
                        <Play size={20} /> INSERT COIN
                    </button>
                </div>
            )}

            {/* Game Over */}
            {gameStateDisplay.gameOver && (
                <div className="absolute inset-0 bg-red-900/90 flex flex-col items-center justify-center text-center z-20">
                    <h2 className="text-3xl text-white mb-2">GAME OVER</h2>
                    <p className="text-yellow-300 mb-8">FINAL SCORE: {gameStateDisplay.score}</p>
                    <button onClick={resetGame} className="px-6 py-3 bg-white text-red-900 font-bold rounded hover:bg-gray-200 flex items-center gap-2">
                        <RefreshCw size={20} /> RETRY
                    </button>
                </div>
            )}

            {/* Victory */}
            {gameStateDisplay.victory && (
                <div className="absolute inset-0 bg-blue-900/90 flex flex-col items-center justify-center text-center z-20">
                    <h2 className="text-3xl text-yellow-400 mb-2">MISSION ACCOMPLISHED</h2>
                    <p className="text-white mb-8">BOSS DEFEATED!</p>
                    <p className="text-sm text-gray-300 mb-8">The skies are safe again.</p>
                    <button onClick={resetGame} className="px-6 py-3 bg-yellow-500 text-blue-900 font-bold rounded hover:bg-yellow-400 flex items-center gap-2">
                        <RefreshCw size={20} /> PLAY AGAIN
                    </button>
                </div>
            )}
        </div>

        <div className="mt-4 text-gray-500 text-xs font-mono">
            Use Keyboard Arrows or WASD to move
        </div>
    </div>
  );
};

export default PixelShooter;