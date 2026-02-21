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
    this.add.text(w / 2, 30, 'LEVEL ' + level.id, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 2,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(w / 2, 50, level.subtitle, {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);

    // Hero walking across
    if (this.textures.exists('hero')) {
      var hero = this.add.sprite(60, h - 42, 'hero', 0);
      hero.setScale(2);
      hero.play('hero-run');
    }

    // Cutscene text - typewriter effect
    this.textLines = level.cutscene || [];
    this.currentLine = 0;
    this.charIndex = 0;
    this.textObj = this.add.text(w / 2, h / 2 + 10, '', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2,
      wordWrap: { width: 400 },
      align: 'center'
    }).setOrigin(0.5);

    this.skipText = this.add.text(w / 2, h - 45, 'TAP TO CONTINUE', {
      fontFamily: 'monospace',
      fontSize: '6px',
      color: '#AAAAAA',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5).setAlpha(0);

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
      this.skipText.setText('TAP TO START LEVEL');
      this.skipText.setAlpha(1);
      this.tweens.add({
        targets: this.skipText,
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
      this.textObj.setText(line.substring(0, this.charIndex + 1));
      this.charIndex++;
      if (TangledTower.AudioGen && TangledTower.AudioGen.initialized && this.charIndex % 2 === 0) {
        TangledTower.AudioGen.playTyping();
      }
      this.typeTimer = this.time.delayedCall(40, this._typeNextChar, [], this);
    } else {
      // Line complete - show skip hint
      this.skipText.setText('TAP TO CONTINUE');
      this.skipText.setAlpha(0.6);
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
      this.skipText.setAlpha(0);
      this._typeNextChar();
    } else {
      // Skip typewriter - show full line
      if (this.typeTimer) this.typeTimer.destroy();
      var line = this.textLines[this.currentLine];
      this.textObj.setText(line);
      this.charIndex = line.length;
      this.skipText.setText('TAP TO CONTINUE');
      this.skipText.setAlpha(0.6);
      this.lineComplete = true;
    }
  }
});
