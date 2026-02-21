// Tangled Tower - Cutscene Scene (between levels)
var TangledTower = TangledTower || {};

TangledTower.CutsceneScene = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function CutsceneScene() {
    Phaser.Scene.call(this, { key: 'CutsceneScene' });
  },

  init: function(data) {
    this.levelIndex = data.level || 0;   // Index into LEVELS array
    this.totalScore = data.score || 0;
    this.lives = data.lives || 3;
  },

  create: function() {
    var w = TangledTower.GAME_WIDTH;
    var h = TangledTower.GAME_HEIGHT;
    var level = TangledTower.LEVELS[this.levelIndex];

    // Background - use the level's sky color
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
      var heroScale = (TangledTower.HERO_SCALE || 0.04) * 1.5;
      var hero = this.add.sprite(60, h - 42, heroKey);
      hero.setScale(heroScale);
      hero.play('hero-run');
    }

    // Cutscene text - typewriter effect
    this.textLines = level.cutscene || [];
    this.currentLine = 0;
    this.charIndex = 0;

    // Use bitmap text for cutscene (manually typed)
    this.textObj = this.add.bitmapText(w / 2, h / 2 + 10, 'pixel-font', '', 8).setOrigin(0.5);
    this.textShadow = this.add.bitmapText(w / 2 + 1, h / 2 + 11, 'pixel-font', '', 8)
      .setOrigin(0.5).setTint(0x000000).setDepth(-1);

    this.skipObj = this.add.bitmapText(w / 2, h - 42, 'pixel-font', '', 8)
      .setOrigin(0.5).setAlpha(0);

    // Start typewriter
    this._typeNextChar();

    // Input - advance or skip
    var self = this;
    this.input.on('pointerdown', function() { self._advance(); });
    this.input.keyboard.on('keydown-SPACE', function() { self._advance(); });
  },

  _typeNextChar: function() {
    if (this.currentLine >= this.textLines.length) {
      // All lines shown
      this.skipObj.setText('TAP TO START LEVEL');
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
      // Line complete - show skip hint
      this.skipObj.setText('TAP TO CONTINUE');
      this.skipObj.setAlpha(0.6);
      this.lineComplete = true;
    }
  },

  _advance: function() {
    if (this.transitioning) return;

    if (this.allTextShown) {
      // Start the level
      this.transitioning = true;
      TangledTower.AudioGen.playMenuSelect();
      this.cameras.main.fadeOut(400, 0, 0, 0);
      var self = this;
      this.time.delayedCall(400, function() {
        self.scene.start('GameScene', {
          level: self.levelIndex,
          score: self.totalScore,
          lives: self.lives
        });
      });
    } else if (this.lineComplete) {
      // Advance to next line
      this.lineComplete = false;
      this.currentLine++;
      this.charIndex = 0;
      this.skipObj.setAlpha(0);
      this._typeNextChar();
    } else {
      // Skip typewriter - show full line
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
