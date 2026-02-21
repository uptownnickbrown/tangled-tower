// Tangled Tower - Game Over Scene
var TangledTower = TangledTower || {};

TangledTower.GameOverScene = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function GameOverScene() {
    Phaser.Scene.call(this, { key: 'GameOverScene' });
  },

  init: function(data) {
    this.levelIndex = data.level || 0;
    this.finalScore = data.score || 0;
  },

  create: function() {
    var w = TangledTower.GAME_WIDTH;
    var h = TangledTower.GAME_HEIGHT;

    this.cameras.main.setBackgroundColor(0x110000);
    this.cameras.main.fadeIn(500);

    // Game Over text
    this.add.text(w / 2, h / 3, 'GAME OVER', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#FF3344',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Score
    this.add.text(w / 2, h / 2, 'SCORE: ' + this.finalScore, {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // Retry text
    var retryText = this.add.text(w / 2, h / 2 + 40, 'TAP TO TRY AGAIN', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5);

    this.tweens.add({
      targets: retryText,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    // Input - restart level
    var self = this;
    var restarted = false;

    var restart = function() {
      if (restarted) return;
      restarted = true;
      TangledTower.AudioGen.playMenuSelect();
      self.cameras.main.fadeOut(400);
      self.time.delayedCall(400, function() {
        self.scene.start('CutsceneScene', {
          level: self.levelIndex,
          score: 0,
          lives: 3
        });
      });
    };

    this.time.delayedCall(800, function() {
      self.input.on('pointerdown', restart);
      self.input.keyboard.on('keydown-SPACE', restart);
    });
  },

  shutdown: function() {
    this.input.removeAllListeners();
    this.input.keyboard.removeAllListeners();
  }
});
