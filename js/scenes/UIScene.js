// Tangled Tower - HUD Overlay Scene
var TangledTower = TangledTower || {};

TangledTower.UIScene = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function UIScene() {
    Phaser.Scene.call(this, { key: 'UIScene' });
  },

  init: function(data) {
    this.currentHealth = data.health || TangledTower.STARTING_LIVES;
    this.currentScore = data.score || 0;
    this.currentLevel = data.level || 1;
    this.levelName = data.levelName || '';
  },

  create: function() {
    var w = TangledTower.GAME_WIDTH;

    // Hearts
    this.hearts = [];
    var maxLives = TangledTower.STARTING_LIVES;
    for (var i = 0; i < maxLives; i++) {
      var heartKey = this.textures.exists('heart') ? 'heart' : null;
      var heart;
      if (heartKey) {
        var heartTex = this.textures.get('heart');
        var isAIHeart = heartTex.source[0].width > 32;
        var heartScale = isAIHeart ? 0.33 : 1.2;
        heart = this.add.sprite(12 + i * 13, 12, 'heart').setScale(heartScale);
      } else {
        heart = this.add.circle(12 + i * 13, 12, 5, 0xFF3344);
      }
      heart.setDepth(100);
      this.hearts.push(heart);
    }

    // Score text
    this.scoreText = this.add.bitmapText(w - 8, 6, 'pixel-font', 'SCORE: 0', 8)
      .setOrigin(1, 0).setDepth(100);
    this.scoreShadow = this.add.bitmapText(w - 7, 7, 'pixel-font', 'SCORE: 0', 8)
      .setOrigin(1, 0).setDepth(99).setTint(0x000000);

    // Level text
    this.levelText = this.add.bitmapText(w - 8, 16, 'pixel-font-gold', 'LEVEL ' + this.currentLevel, 8)
      .setOrigin(1, 0).setDepth(100);

    // Listen for updates from GameScene or BossScene
    var gameScene = this.scene.get('GameScene');
    var bossScene = this.scene.get('BossScene');

    if (gameScene) {
      gameScene.events.on('updateHUD', this._onUpdate, this);
    }
    if (bossScene) {
      bossScene.events.on('updateHUD', this._onUpdate, this);
    }

    this._updateHearts(this.currentHealth);
  },

  _onUpdate: function(data) {
    if (data.health !== undefined) this._updateHearts(data.health);
    if (data.score !== undefined) {
      var scoreStr = 'SCORE: ' + data.score;
      this.scoreText.setText(scoreStr);
      this.scoreShadow.setText(scoreStr);
    }
    if (data.level !== undefined) this.levelText.setText('LEVEL ' + data.level);
  },

  _updateHearts: function(health) {
    for (var i = 0; i < this.hearts.length; i++) {
      if (this.hearts[i].setTint) {
        this.hearts[i].setTint(i < health ? 0xFFFFFF : 0x333333);
      }
      this.hearts[i].setAlpha(i < health ? 1 : 0.3);
    }
    this.currentHealth = health;
  },

  shutdown: function() {
    var gameScene = this.scene.get('GameScene');
    var bossScene = this.scene.get('BossScene');
    if (gameScene) gameScene.events.off('updateHUD', this._onUpdate, this);
    if (bossScene) bossScene.events.off('updateHUD', this._onUpdate, this);
  }
});
