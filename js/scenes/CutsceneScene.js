// Tangled Tower - Cutscene Scene (between levels + intro)
var TangledTower = TangledTower || {};

TangledTower.CutsceneScene = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function CutsceneScene() {
    Phaser.Scene.call(this, { key: 'CutsceneScene' });
  },

  init: function(data) {
    this.levelIndex = data.level || 0;
    this.totalScore = data.score || 0;
    this.lives = data.lives || TangledTower.STARTING_LIVES;
    this.skipIntro = data.skipIntro || false;
    // Reset all state flags (critical for scene.restart() which reuses instance)
    this.transitioning = false;
    this.allTextShown = false;
    this.lineComplete = false;
    this.isIntro = false;
  },

  create: function() {
    var w = TangledTower.GAME_WIDTH;
    var h = TangledTower.GAME_HEIGHT;

    if (this.levelIndex === 0 && this.totalScore === 0 && !this.skipIntro) {
      this._createIntroCutscene(w, h);
    } else {
      this._createLevelCutscene(w, h);
    }

    // Input - advance or skip
    var self = this;
    this.input.on('pointerdown', function() { self._advance(); });
    this.input.keyboard.on('keydown-SPACE', function() { self._advance(); });
  },

  // ===========================================
  // INTRO CUTSCENE - "Once upon a time..."
  // ===========================================
  _createIntroCutscene: function(w, h) {
    this.isIntro = true;
    this.cameras.main.setBackgroundColor(0x111133);
    this.cameras.main.fadeIn(800);

    // Stars in the night sky
    for (var i = 0; i < 40; i++) {
      var star = this.add.circle(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h * 0.6),
        Phaser.Math.Between(1, 2),
        0xFFFFFF
      );
      this.tweens.add({
        targets: star,
        alpha: { from: 0.2, to: 1 },
        duration: Phaser.Math.Between(600, 2000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 1000)
      });
    }

    // Moon
    this.add.circle(w - 50, 35, 18, 0xFFFFCC);
    this.add.circle(w - 46, 31, 13, 0x111133);

    // Ground
    var gfx = this.add.graphics();
    gfx.fillStyle(0x224422, 1);
    gfx.fillRect(0, h - 28, w, 4);
    gfx.fillStyle(0x332211, 1);
    gfx.fillRect(0, h - 24, w, 24);

    // Tower in center
    if (this.textures.exists('tower')) {
      var towerScale = TangledTower.TOWER_SCALE || 0.31;
      this.add.sprite(w / 2, h - 28, 'tower').setOrigin(0.5, 1).setScale(towerScale);
    } else {
      // Fallback simple tower
      gfx.fillStyle(0x888888, 1);
      gfx.fillRect(w / 2 - 18, h - 100, 36, 72);
      gfx.fillStyle(0x666666, 1);
      gfx.fillRect(w / 2 - 22, h - 104, 44, 8);
      gfx.fillStyle(0x222222, 1);
      gfx.fillRect(w / 2 - 5, h - 96, 10, 12);
    }

    // Intro text lines
    this.textLines = [
      'Once upon a time...',
      'A princess named Rapunzel was locked',
      'in the highest room of a tangled tower.',
      'Her golden hair flowed from the window...',
      'Waiting for a brave knight to save her.',
      'Are YOU that hero?'
    ];
    this.currentLine = 0;
    this.charIndex = 0;

    // Text display area (lower portion)
    this.textObj = this.add.bitmapText(w / 2, h * 0.28, 'pixel-font', '', 8).setOrigin(0.5).setDepth(10);
    this.textShadow = this.add.bitmapText(w / 2 + 1, h * 0.28 + 1, 'pixel-font', '', 8)
      .setOrigin(0.5).setTint(0x000000).setDepth(9);

    this.skipObj = this.add.bitmapText(w / 2, h - 10, 'pixel-font', '', 8)
      .setOrigin(0.5).setAlpha(0).setDepth(10);

    // Start typewriter
    this._typeNextChar();
  },

  // ===========================================
  // LEVEL CUTSCENE - Between levels
  // ===========================================
  _createLevelCutscene: function(w, h) {
    this.isIntro = false;
    var level = TangledTower.LEVELS[this.levelIndex];

    this.cameras.main.setBackgroundColor(level.skyColor);
    this.cameras.main.fadeIn(500);

    // Ground
    var gfx = this.add.graphics();
    gfx.fillStyle(0x55CC55, 1);
    gfx.fillRect(0, h - 32, w, 4);
    gfx.fillStyle(0x885522, 1);
    gfx.fillRect(0, h - 28, w, 28);

    // Level header
    TangledTower.bmpText(this, w / 2, 30, 'LEVEL ' + level.id, 16, 0xFFD700);
    TangledTower.bmpText(this, w / 2, 52, level.subtitle.toUpperCase(), 8, 0xFFFFFF);

    // Hero walking across
    var heroKey = this.textures.exists('hero_run1') ? 'hero_run1' :
                  (this.textures.exists('hero_run') ? 'hero_run' : 'hero');
    if (this.textures.exists(heroKey)) {
      var heroScale = (TangledTower.HERO_SCALE || 0.32) * 1.5;
      var hero = this.add.sprite(60, h - 42, heroKey);
      hero.setScale(heroScale);
      hero.play('hero-run');
    }

    // Cutscene text - typewriter effect
    this.textLines = level.cutscene || [];
    this.currentLine = 0;
    this.charIndex = 0;

    this.textObj = this.add.bitmapText(w / 2, h / 2 + 10, 'pixel-font', '', 8).setOrigin(0.5);
    this.textShadow = this.add.bitmapText(w / 2 + 1, h / 2 + 11, 'pixel-font', '', 8)
      .setOrigin(0.5).setTint(0x000000).setDepth(-1);

    this.skipObj = this.add.bitmapText(w / 2, h - 42, 'pixel-font', '', 8)
      .setOrigin(0.5).setAlpha(0);

    // Start typewriter
    this._typeNextChar();
  },

  // ===========================================
  // TYPEWRITER + ADVANCE
  // ===========================================
  _typeNextChar: function() {
    if (this.currentLine >= this.textLines.length) {
      var btnText = this.isIntro ? 'TAP TO BEGIN!' : 'TAP TO START LEVEL';
      this.skipObj.setText(btnText);
      this.skipObj.setAlpha(1);
      this.tweens.add({
        targets: this.skipObj,
        alpha: 0.3,
        duration: 500,
        yoyo: true,
        repeat: -1
      });
      this.allTextShown = true;
      return;
    }

    var line = this.textLines[this.currentLine];
    if (this.charIndex < line.length) {
      var displayText = line.substring(0, this.charIndex + 1).toUpperCase();
      this.textObj.setText(displayText);
      this.textShadow.setText(displayText);
      this.charIndex++;
      if (TangledTower.AudioGen && TangledTower.AudioGen.initialized && this.charIndex % 2 === 0) {
        TangledTower.AudioGen.playTyping();
      }
      this.typeTimer = this.time.delayedCall(40, this._typeNextChar, [], this);
    } else {
      this.skipObj.setText('TAP TO CONTINUE');
      this.skipObj.setAlpha(0.6);
      this.lineComplete = true;
    }
  },

  _advance: function() {
    if (this.transitioning) return;

    if (this.allTextShown) {
      this.transitioning = true;
      TangledTower.AudioGen.playMenuSelect();
      this.cameras.main.fadeOut(400, 0, 0, 0);
      var self = this;

      if (this.isIntro) {
        // After intro, show the Level 1 cutscene
        this.time.delayedCall(400, function() {
          self.isIntro = false;
          self.scene.restart({ level: 0, score: 0, lives: TangledTower.STARTING_LIVES, skipIntro: true });
        });
      } else {
        this.time.delayedCall(400, function() {
          self.scene.start('GameScene', {
            level: self.levelIndex,
            score: self.totalScore,
            lives: self.lives
          });
        });
      }
    } else if (this.lineComplete) {
      this.lineComplete = false;
      this.currentLine++;
      this.charIndex = 0;
      this.skipObj.setAlpha(0);
      this._typeNextChar();
    } else {
      if (this.typeTimer) this.typeTimer.destroy();
      var line = this.textLines[this.currentLine].toUpperCase();
      this.textObj.setText(line);
      this.textShadow.setText(line);
      this.charIndex = line.length;
      this.skipObj.setText('TAP TO CONTINUE');
      this.skipObj.setAlpha(0.6);
      this.lineComplete = true;
    }
  }
});
