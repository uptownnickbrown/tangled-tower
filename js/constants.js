// Tangled Tower - Game Constants
var TangledTower = TangledTower || {};

TangledTower.GAME_WIDTH = 480;
TangledTower.GAME_HEIGHT = 270;

// Hero position (25% from left)
TangledTower.HERO_X = 120;

// World layout
TangledTower.GROUND_Y = 224;        // Top of ground tiles (visual)
TangledTower.GROUND_SURFACE = 220;  // Where hero stands
TangledTower.SPAWN_X = 520;         // Objects spawn off right edge

// AI sprite sizes (used for scaling 1024x1024 PNGs down to game size)
TangledTower.HERO_SCALE = 0.04;     // ~41px tall in game
TangledTower.ENEMY_SCALE = 0.035;   // ~36px tall
TangledTower.BOSS_SCALE = 0.09;     // ~92px tall
TangledTower.TOWER_SCALE = 0.18;    // ~184px tall
TangledTower.POWERUP_SCALE = 0.02;  // ~20px
TangledTower.VINE_SCALE = 0.04;     // ~41px tall

// Physics
TangledTower.GRAVITY = 900;
TangledTower.JUMP_VELOCITY = -320;
TangledTower.DOUBLE_JUMP_VELOCITY = -280;
TangledTower.CHARGED_JUMP_VELOCITY = -440;
TangledTower.CROUCH_THRESHOLD = 200; // ms hold before crouch activates

// Gameplay
TangledTower.INVINCIBILITY_TIME = 1500; // ms
TangledTower.SPEED_BOOST_DURATION = 5000; // ms
TangledTower.SPEED_BOOST_MULT = 1.5;

// 8-bit color palette
TangledTower.PALETTE = {
  // Character
  SKIN:        0xFFD8A8,
  HAIR_BROWN:  0x8B4513,
  HAIR_GOLD:   0xFFD700,
  ARMOR_BLUE:  0x4477CC,
  ARMOR_DARK:  0x2B4F8C,
  CAPE_RED:    0xCC3333,
  CAPE_DARK:   0x991919,
  HELMET_GRAY: 0xBBBBBB,
  HELMET_DARK: 0x777777,
  HELMET_LIGHT:0xDDDDDD,
  BOOT_BROWN:  0x774422,
  BOOT_DARK:   0x552211,
  BELT_BROWN:  0x886633,
  EYE_WHITE:   0xFFFFFF,
  EYE_BLACK:   0x222222,

  // Rapunzel
  DRESS_PURPLE: 0x9944BB,
  DRESS_DARK:   0x6B2D8B,
  HAIR_SHINE:   0xFFEE55,

  // Enemies
  GOBLIN_GREEN: 0x55BB55,
  GOBLIN_DARK:  0x338833,
  GOBLIN_EYES:  0xFF4444,
  BAT_PURPLE:   0x774488,
  BAT_DARK:     0x553366,
  BAT_WING:     0x664477,
  BAT_EYES:     0xFF6666,
  VINE_GREEN:   0x228822,
  VINE_DARK:    0x115511,
  VINE_LIGHT:   0x33AA33,
  THORN_RED:    0xCC3333,

  // Bosses
  TROLL_BROWN:   0x997755,
  TROLL_DARK:    0x664422,
  TROLL_LIGHT:   0xBB9966,
  DRAGON_GREEN:  0x44AA44,
  DRAGON_DARK:   0x227722,
  DRAGON_BELLY:  0xCCBB55,
  DRAGON_FIRE:   0xFF6622,
  KNIGHT_BLACK:  0x444455,
  KNIGHT_DARK:   0x222233,
  KNIGHT_PURPLE: 0x664488,
  VINE_BOSS_GRN: 0x116611,

  // Environment
  GRASS_TOP:     0x55CC55,
  GRASS_DARK:    0x339933,
  DIRT_BROWN:    0x885522,
  DIRT_DARK:     0x663311,
  DIRT_CHECK:    0x774411,
  STONE_GRAY:    0x999999,
  STONE_DARK:    0x666666,
  STONE_LIGHT:   0xBBBBBB,
  CLOUD_WHITE:   0xFFFFFF,
  CLOUD_LIGHT:   0xEEEEFF,

  // Sky colors per level
  SKY_MORNING:   0x88CCFF,
  SKY_AFTERNOON: 0xFFCC66,
  SKY_SUNSET:    0xFF6644,
  SKY_TWILIGHT:  0x334466,
  SKY_NIGHT:     0x111133,

  // Items
  COIN_GOLD:     0xFFDD00,
  COIN_SHINE:    0xFFFF88,
  COIN_DARK:     0xCC9900,
  SHIELD_CYAN:   0x44DDFF,
  SHIELD_LIGHT:  0x88EEFF,
  SHIELD_DARK:   0x2299BB,
  BOOT_ORANGE:   0xFF8800,
  BOOT_LIGHT:    0xFFAA33,
  SWORD_SILVER:  0xCCCCDD,
  SWORD_LIGHT:   0xEEEEFF,
  SWORD_DARK:    0x8888AA,
  SWORD_HILT:    0x886633,

  // UI
  HEART_RED:     0xFF3344,
  HEART_DARK:    0xCC1122,
  HEART_SHINE:   0xFF8899,
  WHITE:         0xFFFFFF,
  BLACK:         0x000000,
  TEXT_SHADOW:   0x222222
};

// Shorthand
var P = TangledTower.PALETTE;
var _ = null; // transparent pixel shorthand
