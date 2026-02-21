// Tangled Tower - Title Screen
var TangledTower = TangledTower || {};

TangledTower.TitleScene = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function TitleScene() {
    Phaser.Scene.call(this, { key: 'TitleScene' });
  },

  create: function() {
    var w = TangledTower.GAME_WIDTH;
    var h = TangledTower.GAME_HEIGHT;

    // Sky background
    this.cameras.main.setBackgroundColor(0x88CCFF);

    // Ground strip at bottom
    var groundGfx = this.add.graphics();
    groundGfx.fillStyle(0x55CC55, 1);
    groundGfx.fillRect(0, h - 40, w, 6);
    groundGfx.fillStyle(0x885522, 1);
    groundGfx.fillRect(0, h - 34, w, 34);

    // Simple clouds
    this._drawCloud(80, 50, 1.5);
    this._drawCloud(250, 30, 1);
    this._drawCloud(380, 60, 1.2);

    // Tower on right side
    if (this.textures.exists('tower')) {
      var towerScale = TangledTower.TOWER_SCALE || 0.31;
      this.add.sprite(w - 60, h - 40, 'tower').setOrigin(0.5, 1).setScale(towerScale);
    }

    // Title text
    TangledTower.bmpText(this, w / 2, 40, 'TANGLED', 24, 0xFFD700);
    TangledTower.bmpText(this, w / 2, 72, 'TOWER', 24, 0xFFD700);

    // Hero sprite running in place
    var heroKey = this.textures.exists('hero_run1') ? 'hero_run1' :
                  (this.textures.exists('hero_run') ? 'hero_run' : 'hero');
    if (this.textures.exists(heroKey)) {
      var heroScale = (TangledTower.HERO_SCALE || 0.32) * 1.5;
      var hero = this.add.sprite(100, h - 50, heroKey);
      hero.setScale(heroScale);
      hero.play('hero-run');
    }

    // Tap to start - blinking
    var startText = TangledTower.bmpText(this, w / 2, h - 70, 'TAP TO START', 16, 0xFFFFFF);

    this.tweens.add({
      targets: [startText, startText._shadow],
      alpha: 0.2,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    // Sound toggle hint
    TangledTower.bmpText(this, w - 50, 12, 'SOUND: ON', 8, 0xFFFFFF);

    // Wait for input
    var self = this;
    var started = false;

    var startGame = function() {
      if (started) return;
      started = true;

      // Initialize audio on first interaction (iOS requirement)
      TangledTower.AudioGen.init();
      TangledTower.AudioGen.playMenuSelect();

      // Brief delay then start
      self.cameras.main.fadeOut(500, 0, 0, 0);
      self.time.delayedCall(500, function() {
        self.scene.start('CutsceneScene', { level: 0, score: 0, lives: TangledTower.STARTING_LIVES });
      });
    };

    this.input.on('pointerdown', startGame);
    this.input.keyboard.on('keydown-SPACE', startGame);
  },

  _drawCloud: function(x, y, scale) {
    var gfx = this.add.graphics();
    gfx.fillStyle(0xFFFFFF, 0.9);
    gfx.fillEllipse(x, y, 30 * scale, 12 * scale);
    gfx.fillEllipse(x - 10 * scale, y + 2, 16 * scale, 8 * scale);
    gfx.fillEllipse(x + 12 * scale, y + 2, 20 * scale, 8 * scale);
  }
});
