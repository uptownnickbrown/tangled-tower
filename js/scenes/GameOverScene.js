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
    TangledTower.bmpText(this, w / 2, h / 3, 'GAME OVER', 24, 0xFF3344);

    // Score
    TangledTower.bmpText(this, w / 2, h / 2, 'SCORE: ' + this.finalScore, 16, 0xFFFFFF);

    // Retry text
    var retryText = TangledTower.bmpText(this, w / 2, h / 2 + 40, 'TAP TO TRY AGAIN', 8, 0xFFFFFF);

    this.tweens.add({
      targets: [retryText, retryText._shadow],
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
          lives: TangledTower.STARTING_LIVES
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
