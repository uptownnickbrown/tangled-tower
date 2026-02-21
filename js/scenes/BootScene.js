// Tangled Tower - Boot Scene
// Loads AI sprites, generates procedural textures, creates animations
var TangledTower = TangledTower || {};

TangledTower.BootScene = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function BootScene() {
    Phaser.Scene.call(this, { key: 'BootScene' });
  },

  preload: function() {
    var w = TangledTower.GAME_WIDTH;
    var h = TangledTower.GAME_HEIGHT;

    // Loading screen
    this.cameras.main.setBackgroundColor(0x000000);
    var loadText = this.add.text(w / 2, h / 2 - 20, 'TANGLED TOWER', {
      fontFamily: 'monospace', fontSize: '16px', color: '#FFD700'
    }).setOrigin(0.5);
    var subText = this.add.text(w / 2, h / 2 + 10, 'Loading...', {
      fontFamily: 'monospace', fontSize: '8px', color: '#FFFFFF'
    }).setOrigin(0.5);

    // Load AI-generated sprites
    var sprites = [
      'hero_run', 'hero_run1', 'hero_run2', 'hero_run3',
      'hero_jump', 'hero_crouch', 'hero_hurt',
      'tower', 'goblin', 'bat', 'vine',
      'boss_troll', 'boss_vine', 'boss_bat', 'boss_knight', 'boss_dragon',
      'powerup_shield', 'powerup_boots', 'powerup_sword',
      'coin', 'heart',
      'bg_tree', 'bg_bush', 'bg_rock', 'butterfly', 'firefly'
    ];

    for (var i = 0; i < sprites.length; i++) {
      this.load.image(sprites[i], 'assets/sprites/' + sprites[i] + '.png');
    }
  },

  create: function() {
    // Generate procedural textures (ground, backgrounds, small items)
    TangledTower.SpriteGen.createAllTextures(this);

    // Create bitmap pixel font
    TangledTower.SpriteGen.createBitmapFont(this);

    // Create animations
    this._createAnimations();

    // Start game
    this.scene.start('TitleScene');
  },

  _createAnimations: function() {
    // Hero run cycle - 3 AI-generated frames for smooth animation
    var runFrames = [];
    if (this.textures.exists('hero_run1')) {
      runFrames = [
        { key: 'hero_run1' },
        { key: 'hero_run2' },
        { key: 'hero_run3' },
        { key: 'hero_run2' }  // bounce back for smoother loop
      ];
    } else {
      runFrames = [{ key: 'hero_run' }];
    }
    this.anims.create({
      key: 'hero-run',
      frames: runFrames,
      frameRate: 8,
      repeat: -1
    });

    this.anims.create({
      key: 'hero-jump',
      frames: [{ key: 'hero_jump' }],
      frameRate: 1
    });

    this.anims.create({
      key: 'hero-crouch',
      frames: [{ key: 'hero_crouch' }],
      frameRate: 1
    });

    this.anims.create({
      key: 'hero-hurt',
      frames: [{ key: 'hero_hurt' }],
      frameRate: 1
    });

    // Goblin - single image, no animation frames needed
    this.anims.create({
      key: 'goblin-walk',
      frames: [{ key: 'goblin' }],
      frameRate: 1,
      repeat: -1
    });

    this.anims.create({
      key: 'goblin-die',
      frames: [{ key: 'goblin' }],
      frameRate: 1
    });

    // Bat
    this.anims.create({
      key: 'bat-fly',
      frames: [{ key: 'bat' }],
      frameRate: 1,
      repeat: -1
    });

    // Coin - use procedural if exists, else AI image
    var coinKey = this.textures.exists('coin-proc') ? 'coin-proc' : 'coin';
    this.anims.create({
      key: 'coin-spin',
      frames: this.textures.exists('coin-proc')
        ? [
            { key: 'coin-proc', frame: 0 },
            { key: 'coin-proc', frame: 1 },
            { key: 'coin-proc', frame: 2 },
            { key: 'coin-proc', frame: 3 }
          ]
        : [{ key: 'coin' }],
      frameRate: 8,
      repeat: -1
    });

    // Shield glow
    var shieldKey = this.textures.exists('shield-powerup') ? 'shield-powerup' : 'powerup_shield';
    this.anims.create({
      key: 'shield-glow',
      frames: this.textures.exists('shield-powerup')
        ? [{ key: 'shield-powerup', frame: 0 }, { key: 'shield-powerup', frame: 1 }]
        : [{ key: 'powerup_shield' }],
      frameRate: 4,
      repeat: -1
    });

    // Sword shine
    var swordKey = this.textures.exists('sword-powerup') ? 'sword-powerup' : 'powerup_sword';
    this.anims.create({
      key: 'sword-shine',
      frames: this.textures.exists('sword-powerup')
        ? [{ key: 'sword-powerup', frame: 0 }, { key: 'sword-powerup', frame: 1 }]
        : [{ key: 'powerup_sword' }],
      frameRate: 4,
      repeat: -1
    });

    // Fireball (procedural only)
    if (this.textures.exists('fireball')) {
      this.anims.create({
        key: 'fireball-burn',
        frames: [
          { key: 'fireball', frame: 0 },
          { key: 'fireball', frame: 1 }
        ],
        frameRate: 10,
        repeat: -1
      });
    }

    // Boss animations - AI sprites are single images
    var bosses = [
      { key: 'boss_troll', prefix: 'troll' },
      { key: 'boss_vine', prefix: 'vine' },
      { key: 'boss_bat', prefix: 'bat-boss' },
      { key: 'boss_knight', prefix: 'dknight' },
      { key: 'boss_dragon', prefix: 'dragon' }
    ];

    for (var i = 0; i < bosses.length; i++) {
      var b = bosses[i];
      this.anims.create({
        key: b.prefix + '-idle',
        frames: [{ key: b.key }],
        frameRate: 1,
        repeat: -1
      });
      this.anims.create({
        key: b.prefix + '-attack',
        frames: [{ key: b.key }],
        frameRate: 1
      });
    }
  }
});
