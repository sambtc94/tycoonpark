// ═══════════════════════════════════════════════════════
//  CONSTANTS & CONFIGURATION
// ═══════════════════════════════════════════════════════

const TILE_W = 64;
const TILE_H = 32;
const GRID_COLS = 40;
const GRID_ROWS = 40;
const MONTH_TICKS = 600; // simulation ticks per in-game month

const RIDE_TYPES = {
  coaster:  { name: 'Roller Coaster', icon: '🎢', cost: 5000, excitement: 8.5, intensity: 7.5, nausea: 5.0, capacity: 24, ticketMult: 1.4, size: 3, color: '#e74c3c', category: 'thrill' },
  looper:   { name: 'Loop Coaster',   icon: '🔄', cost: 6500, excitement: 9.0, intensity: 9.0, nausea: 6.5, capacity: 20, ticketMult: 1.6, size: 3, color: '#8e44ad', category: 'thrill' },
  drop:     { name: 'Drop Tower',     icon: '⬇️', cost: 3000, excitement: 7.0, intensity: 8.0, nausea: 4.0, capacity: 16, ticketMult: 1.2, size: 2, color: '#e67e22', category: 'thrill' },
  ferris:   { name: 'Ferris Wheel',   icon: '🎡', cost: 2000, excitement: 4.0, intensity: 1.0, nausea: 0.5, capacity: 32, ticketMult: 0.8, size: 2, color: '#f39c12', category: 'gentle' },
  carousel: { name: 'Carousel',       icon: '🎠', cost: 1500, excitement: 3.0, intensity: 0.5, nausea: 0.0, capacity: 20, ticketMult: 0.6, size: 2, color: '#e91e63', category: 'gentle' },
  bumper:   { name: 'Bumper Cars',    icon: '🚗', cost: 1800, excitement: 4.5, intensity: 2.5, nausea: 1.0, capacity: 16, ticketMult: 0.7, size: 2, color: '#2196f3', category: 'gentle' },
  flume:    { name: 'Log Flume',      icon: '🌊', cost: 4000, excitement: 6.5, intensity: 4.5, nausea: 2.5, capacity: 20, ticketMult: 1.0, size: 3, color: '#00bcd4', category: 'water'  },
  rapids:   { name: 'River Rapids',   icon: '💦', cost: 3500, excitement: 6.0, intensity: 5.0, nausea: 3.0, capacity: 24, ticketMult: 0.9, size: 3, color: '#009688', category: 'water'  },
  food:     { name: 'Food Stall',     icon: '🍔', cost:  600, excitement: 0,   intensity: 0,   nausea: 0,   capacity:  0, ticketMult: 0,   size: 1, color: '#ff9800', category: 'shop'   },
  drink:    { name: 'Drink Stall',    icon: '🧃', cost:  500, excitement: 0,   intensity: 0,   nausea: 0,   capacity:  0, ticketMult: 0,   size: 1, color: '#4caf50', category: 'shop'   },
  souvenir: { name: 'Souvenir Shop',  icon: '🎁', cost:  800, excitement: 0,   intensity: 0,   nausea: 0,   capacity:  0, ticketMult: 0,   size: 1, color: '#9c27b0', category: 'shop'   },
};

const SCENERY_TYPES = {
  tree:     { icon: '🌳', cost:  50 },
  bench:    { icon: '🪑', cost:  80 },
  fountain: { icon: '⛲', cost: 200 },
};

const WEATHER_TYPES = [
  { name: 'Sunny',  icon: '☀️',  tempRange: [22, 32], guestMult: 1.2, happyMod:   5 },
  { name: 'Cloudy', icon: '⛅',  tempRange: [16, 24], guestMult: 1.0, happyMod:   0 },
  { name: 'Rainy',  icon: '🌧️', tempRange: [10, 18], guestMult: 0.6, happyMod: -10 },
  { name: 'Stormy', icon: '⛈️', tempRange: [ 8, 15], guestMult: 0.2, happyMod: -20 },
  { name: 'Windy',  icon: '🌬️', tempRange: [14, 22], guestMult: 0.85,happyMod:  -5 },
  { name: 'Snowy',  icon: '❄️', tempRange: [-2,  6], guestMult: 0.3, happyMod: -15 },
  { name: 'Hot',    icon: '🌡️', tempRange: [32, 40], guestMult: 0.9, happyMod:  -5 },
];

const MARKETING_CAMPAIGNS = [
  { id: 'flyer',  name: 'Flyer Drop',      cost:  500, duration: 3, guestBonus:  20, desc: 'Attract 20 extra guests/month for 3 months' },
  { id: 'tv',     name: 'TV Commercial',   cost: 3000, duration: 6, guestBonus:  60, desc: 'Attract 60 extra guests/month for 6 months' },
  { id: 'online', name: 'Online Campaign', cost: 1500, duration: 4, guestBonus:  35, desc: 'Attract 35 extra guests/month for 4 months' },
  { id: 'promo',  name: 'Special Event',   cost: 5000, duration: 2, guestBonus: 150, desc: 'Massive event bringing 150 extra guests for 2 months' },
];

const GUEST_COLORS = ['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#ff922b','#cc5de8','#f06595','#74c0fc'];
const GUEST_NAMES  = ['Alice','Bob','Carol','Dave','Eve','Frank','Grace','Hank','Iris','Jack','Kim','Leo'];

const GRASS_SHADES = ['#2d5a27','#2e5c28','#305f2a','#2c5826','#2f5b28'];

// Default entrance position (set during state initialisation)
const ENT_ROW = Math.floor(GRID_ROWS * 0.75);
const ENT_COL = Math.floor(GRID_COLS / 2);
