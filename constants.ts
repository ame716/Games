export const GAME_WIDTH = 400;
export const GAME_HEIGHT = 600;

export const COLORS = {
  player: '#3b82f6', // Blue
  playerHit: '#93c5fd',
  enemyGrunt: '#ef4444', // Red
  enemyFighter: '#f97316', // Orange
  enemyTank: '#8b5cf6', // Purple
  boss: '#dc2626', // Dark Red
  bulletPlayer: '#facc15', // Yellow
  bulletEnemy: '#f87171', // Light Red
  powerUpA: '#10b981', // Emerald (Angle)
  powerUpB: '#06b6d4', // Cyan (Beam)
  powerUpC: '#f43f5e', // Rose (Cannon)
  powerUpS: '#eab308', // Yellow (Speed)
  text: '#ffffff',
};

// Simple binary sprites (1 = draw, 0 = empty)
export const SPRITES = {
  PLAYER: [
    [0,0,0,1,0,0,0],
    [0,0,1,1,1,0,0],
    [0,1,1,0,1,1,0],
    [0,1,1,1,1,1,0],
    [1,1,0,1,0,1,1],
    [1,0,0,1,0,0,1],
  ],
  ENEMY_GRUNT: [
    [1,0,1,1,1,0,1],
    [0,1,1,1,1,1,0],
    [0,1,0,1,0,1,0],
    [0,1,0,0,0,1,0],
  ],
  ENEMY_FIGHTER: [
    [0,0,1,0,1,0,0],
    [0,1,1,1,1,1,0],
    [1,1,0,1,0,1,1],
    [0,1,0,0,0,1,0],
  ],
  ENEMY_TANK: [
    [0,1,1,1,1,1,0],
    [1,1,1,1,1,1,1],
    [1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1],
  ],
  POWERUP_BOX: [
    [1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1],
  ],
  BOSS: [
    [0,0,1,1,1,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,0],
    [1,1,0,1,1,0,0,1,1,0,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,0,1,0,1,1,0,1,0,1,1],
    [0,1,0,1,0,0,0,0,1,0,1,0],
    [0,0,1,0,0,1,1,0,0,1,0,0],
  ]
};

export const BOSS_SPAWN_SCORE = 2000;
export const POWERUP_DROP_RATE = 0.2;

export const WEAPON_STATS = {
  DEFAULT: { damage: 10, cooldown: 15, speed: 7 },
  A: { damage: 8, cooldown: 18, speed: 6 }, // Angle: Spread
  B: { damage: 20, cooldown: 25, speed: 12 }, // Beam: Fast, High Dmg
  C: { damage: 35, cooldown: 40, speed: 4 }, // Cannon: Slow, Huge Dmg
  S: { damage: 6, cooldown: 5, speed: 9 }, // Speed: Rapid Fire
};