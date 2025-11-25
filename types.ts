export enum WeaponType {
  DEFAULT = 'DEFAULT',
  A = 'A', // Angle (Spread)
  B = 'B', // Beam (Fast)
  C = 'C', // Cannon (Big damage)
  S = 'S', // Speed (Rapid fire)
}

export interface Entity {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  color: string;
  dead: boolean;
}

export interface Player extends Entity {
  hp: number;
  maxHp: number;
  weapon: WeaponType;
  score: number;
  invulnerableFrames: number;
  shootTimer: number;
}

export interface Enemy extends Entity {
  hp: number;
  maxHp: number;
  type: 'grunt' | 'fighter' | 'tank' | 'boss';
  scoreValue: number;
  shootTimer: number;
}

export interface Bullet extends Entity {
  damage: number;
  owner: 'player' | 'enemy';
  type: WeaponType | 'enemy_basic' | 'boss_special';
}

export interface Particle extends Entity {
  life: number;
  maxLife: number;
  size: number;
}

export interface PowerUp extends Entity {
  type: WeaponType;
}

export interface GameState {
  player: Player;
  enemies: Enemy[];
  bullets: Bullet[];
  particles: Particle[];
  powerUps: PowerUp[];
  stars: { x: number; y: number; speed: number; brightness: number }[];
  score: number;
  level: number;
  gameOver: boolean;
  victory: boolean;
  bossSpawned: boolean;
  shake: number;
  frameCount: number;
}