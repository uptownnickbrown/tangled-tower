// Tangled Tower - Level Configurations
var TangledTower = TangledTower || {};

TangledTower.LEVELS = [
  // Level 1 - Bright Morning
  {
    id: 1,
    name: 'Bright Morning',
    subtitle: 'The Journey Begins',
    skyColor: 0x88CCFF,
    groundTint: 0xFFFFFF,
    scrollSpeed: 75,
    maxScrollSpeed: 100,
    levelLength: 4000,
    musicIndex: 0,

    bgTints: {
      far: 0xAADDFF,
      mid: 0x88CC88,
      near: 0x66BB66
    },

    spawns: [
      { type: 'coin',        freq: 160, startAfter: 80 },
      { type: 'coin_arc',    freq: 550, startAfter: 250 },
      { type: 'vine_small',  freq: 500, startAfter: 300 },
      { type: 'vine_medium', freq: 840, startAfter: 1200 },
      { type: 'goblin',      freq: 780, startAfter: 600 },
      { type: 'bat',         freq: 1260, startAfter: 1800 },
      { type: 'shield',      freq: 3000, startAfter: 700 },
      { type: 'boots',       freq: 4000, startAfter: 1500 },
      { type: 'sword',       freq: 4500, startAfter: 2500 },
    ],

    // Tutorial hints at specific distances
    events: [
      { at: 150,  type: 'hint', text: 'TAP TO JUMP!' },
      { at: 900,  type: 'hint', text: 'DOUBLE TAP FOR DOUBLE JUMP!' },
      { at: 1800, type: 'hint', text: 'HOLD TO CROUCH!' },
    ],

    boss: {
      type: 'troll',
      name: 'Giant Troll',
      duration: 20,
      attacks: ['ground_pound', 'rock_throw'],
      attackInterval: 2.8,
      spriteKey: 'boss-troll'
    },

    cutscene: [
      'Our brave knight sets forth at dawn...',
      'The princess waits in the Tangled Tower...',
      'Through the enchanted lands we must go!'
    ]
  },

  // Level 2 - Golden Afternoon
  {
    id: 2,
    name: 'Golden Afternoon',
    subtitle: 'Into the Forest',
    skyColor: 0xFFCC66,
    groundTint: 0xDDCC88,
    scrollSpeed: 82,
    maxScrollSpeed: 110,
    levelLength: 6000,
    musicIndex: 1,

    bgTints: {
      far: 0xFFDDAA,
      mid: 0xBB9955,
      near: 0xAA8844
    },

    spawns: [
      { type: 'coin',        freq: 160, startAfter: 50 },
      { type: 'coin_arc',    freq: 600, startAfter: 200 },
      { type: 'vine_small',  freq: 560, startAfter: 100 },
      { type: 'vine_medium', freq: 980, startAfter: 1000 },
      { type: 'goblin',      freq: 840, startAfter: 300 },
      { type: 'bat',         freq: 1680, startAfter: 1800 },
      { type: 'shield',      freq: 3000, startAfter: 500 },
      { type: 'boots',       freq: 4500, startAfter: 1500 },
    ],

    events: [],

    boss: {
      type: 'vine_monster',
      name: 'Vine Monster',
      duration: 22,
      attacks: ['vine_whip', 'thorn_rain'],
      attackInterval: 2.5,
      spriteKey: 'boss-vine'
    },

    cutscene: [
      'The sun climbs high as dangers grow...',
      'Golden light fills the path ahead...',
      'But dark creatures stir in the shadows!'
    ]
  },

  // Level 3 - Sunset
  {
    id: 3,
    name: 'Sunset',
    subtitle: 'The Long Road',
    skyColor: 0xFF6644,
    groundTint: 0xCC9966,
    scrollSpeed: 100,
    maxScrollSpeed: 135,
    levelLength: 6500,
    musicIndex: 2,

    bgTints: {
      far: 0xFF8866,
      mid: 0x886644,
      near: 0x775533
    },

    spawns: [
      { type: 'coin',        freq: 150, startAfter: 0 },
      { type: 'coin_arc',    freq: 550, startAfter: 100 },
      { type: 'vine_small',  freq: 420, startAfter: 0 },
      { type: 'vine_medium', freq: 660, startAfter: 500 },
      { type: 'vine_tall',   freq: 1080, startAfter: 2000 },
      { type: 'goblin',      freq: 600, startAfter: 200 },
      { type: 'bat',         freq: 840, startAfter: 500 },
      { type: 'shield',      freq: 2500, startAfter: 400 },
      { type: 'boots',       freq: 3500, startAfter: 1000 },
      { type: 'sword',       freq: 5000, startAfter: 2000 },
    ],

    events: [],

    boss: {
      type: 'giant_bat',
      name: 'Giant Bat',
      duration: 25,
      attacks: ['swoop', 'sonic_screech', 'bat_swarm'],
      attackInterval: 2.2,
      spriteKey: 'boss-bat'
    },

    cutscene: [
      'The sky blazes red as evening falls...',
      'Thorns grow thicker along the way...',
      'The tower draws closer... and so do our foes!'
    ]
  },

  // Level 4 - Twilight
  {
    id: 4,
    name: 'Twilight',
    subtitle: 'Dark Forest',
    skyColor: 0x334466,
    groundTint: 0x667766,
    scrollSpeed: 110,
    maxScrollSpeed: 145,
    levelLength: 7000,
    musicIndex: 3,

    bgTints: {
      far: 0x334455,
      mid: 0x334433,
      near: 0x445544
    },

    spawns: [
      { type: 'coin',        freq: 140, startAfter: 0 },
      { type: 'coin_arc',    freq: 500, startAfter: 50 },
      { type: 'vine_small',  freq: 360, startAfter: 0 },
      { type: 'vine_medium', freq: 540, startAfter: 200 },
      { type: 'vine_tall',   freq: 840, startAfter: 800 },
      { type: 'goblin',      freq: 480, startAfter: 100 },
      { type: 'bat',         freq: 600, startAfter: 200 },
      { type: 'shield',      freq: 2000, startAfter: 300 },
      { type: 'boots',       freq: 3000, startAfter: 700 },
      { type: 'sword',       freq: 4000, startAfter: 1200 },
    ],

    events: [],

    boss: {
      type: 'dark_knight',
      name: 'Dark Knight',
      duration: 27,
      attacks: ['sword_slash', 'charge', 'dark_bolt'],
      attackInterval: 2.0,
      spriteKey: 'boss-knight'
    },

    cutscene: [
      'Stars appear as twilight descends...',
      'Strange magic fills the darkening air...',
      'Only the bravest knight would press on!'
    ]
  },

  // Level 5 - Moonlit Night
  {
    id: 5,
    name: 'Moonlit Night',
    subtitle: 'The Tower Awaits',
    skyColor: 0x111133,
    groundTint: 0x445566,
    scrollSpeed: 120,
    maxScrollSpeed: 155,
    levelLength: 7500,
    musicIndex: 4,

    bgTints: {
      far: 0x222244,
      mid: 0x223322,
      near: 0x334433
    },

    spawns: [
      { type: 'coin',        freq: 130, startAfter: 0 },
      { type: 'coin_arc',    freq: 450, startAfter: 0 },
      { type: 'vine_medium', freq: 420, startAfter: 0 },
      { type: 'vine_tall',   freq: 660, startAfter: 300 },
      { type: 'goblin',      freq: 420, startAfter: 0 },
      { type: 'bat',         freq: 480, startAfter: 0 },
      { type: 'shield',      freq: 1800, startAfter: 200 },
      { type: 'boots',       freq: 2500, startAfter: 500 },
      { type: 'sword',       freq: 3000, startAfter: 800 },
    ],

    events: [
      { at: 6000, type: 'tower_visible' }
    ],

    boss: {
      type: 'dragon',
      name: 'Dragon',
      duration: 30,
      attacks: ['fireball', 'fire_breath', 'tail_sweep', 'dive_bomb'],
      attackInterval: 1.8,
      spriteKey: 'boss-dragon'
    },

    cutscene: [
      'Moonlight reveals the Tangled Tower at last!',
      'A fearsome dragon guards the final approach...',
      'One last charge, brave knight... for the princess!'
    ]
  }
];

// Cutscene text for the victory
TangledTower.VICTORY_TEXT = [
  'The dragon falls! The tower is free!',
  'Our brave knight climbs the golden hair...',
  'Princess Rapunzel is rescued at last!',
  'THE END'
];
