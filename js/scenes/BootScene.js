// Tangled Tower - Boot Scene
// Generates all textures and animations, then transitions to title
var TangledTower = TangledTower || {};

TangledTower.BootScene = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function BootScene() {
    Phaser.Scene.call(this, { key: 'BootScene' });
  },

  create: function() {
    var w = TangledTower.GAME_WIDTH;
    var h = TangledTower.GAME_HEIGHT;

    // Show loading text
    this.cameras.main.setBackgroundColor(0x000000);
    var loadText = this.add.text(w / 2, h / 2 - 20, 'TANGLED TOWER', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#FFD700'
    }).setOrigin(0.5);

    var subText = this.add.text(w / 2, h / 2 + 10, 'Loading...', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    // Generate all sprites and animations
    var self = this;
    this.time.delayedCall(100, function() {
      TangledTower.SpriteGen.createAllTextures(self);
      self._createAnimations();
      self.scene.start('TitleScene');
    });
  },

  _createAnimations: function() {
    // Hero animations
    this.anims.create({
      key: 'hero-run',
      frames: [
        { key: 'hero', frame: 0 },
        { key: 'hero', frame: 1 },
        { key: 'hero', frame: 2 },
        { key: 'hero', frame: 3 }
      ],
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'hero-jump',
      frames: [{ key: 'hero', frame: 4 }],
      frameRate: 1
    });

    this.anims.create({
      key: 'hero-crouch',
      frames: [{ key: 'hero', frame: 5 }],
      frameRate: 1
    });

    this.anims.create({
      key: 'hero-hurt',
      frames: [{ key: 'hero', frame: 6 }],
      frameRate: 1
    });

    // Goblin animations
    this.anims.create({
      key: 'goblin-walk',
      frames: [
        { key: 'goblin', frame: 0 },
        { key: 'goblin', frame: 1 }
      ],
      frameRate: 6,
      repeat: -1
    });

    this.anims.create({
      key: 'goblin-die',
      frames: [{ key: 'goblin', frame: 3 }],
      frameRate: 1
    });

    // Bat animations
    this.anims.create({
      key: 'bat-fly',
      frames: [
        { key: 'bat', frame: 0 },
        { key: 'bat', frame: 1 }
      ],
      frameRate: 8,
      repeat: -1
    });

    this.anims.create({
      key: 'bat-swoop',
      frames: [{ key: 'bat', frame: 2 }],
      frameRate: 1
    });

    // Coin animation
    this.anims.create({
      key: 'coin-spin',
      frames: [
        { key: 'coin', frame: 0 },
        { key: 'coin', frame: 1 },
        { key: 'coin', frame: 2 },
        { key: 'coin', frame: 3 }
      ],
      frameRate: 8,
      repeat: -1
    });

    // Shield glow
    this.anims.create({
      key: 'shield-glow',
      frames: [
        { key: 'shield-powerup', frame: 0 },
        { key: 'shield-powerup', frame: 1 }
      ],
      frameRate: 4,
      repeat: -1
    });

    // Sword shine
    this.anims.create({
      key: 'sword-shine',
      frames: [
        { key: 'sword-powerup', frame: 0 },
        { key: 'sword-powerup', frame: 1 }
      ],
      frameRate: 4,
      repeat: -1
    });

    // Fireball
    this.anims.create({
      key: 'fireball-burn',
      frames: [
        { key: 'fireball', frame: 0 },
        { key: 'fireball', frame: 1 }
      ],
      frameRate: 10,
      repeat: -1
    });

    // Boss animations
    var bosses = [
      { key: 'boss-troll', prefix: 'troll' },
      { key: 'boss-vine', prefix: 'vine' },
      { key: 'boss-bat', prefix: 'bat-boss' },
      { key: 'boss-knight', prefix: 'dknight' },
      { key: 'boss-dragon', prefix: 'dragon' }
    ];

    for (var i = 0; i < bosses.length; i++) {
      var b = bosses[i];
      this.anims.create({
        key: b.prefix + '-idle',
        frames: [
          { key: b.key, frame: 0 },
          { key: b.key, frame: 1 }
        ],
        frameRate: 3,
        repeat: -1
      });
      this.anims.create({
        key: b.prefix + '-attack',
        frames: [{ key: b.key, frame: 2 }],
        frameRate: 1
      });
    }
  }
});
