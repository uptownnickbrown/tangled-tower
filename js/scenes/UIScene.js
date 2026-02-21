// Tangled Tower - HUD Overlay Scene
var TangledTower = TangledTower || {};

TangledTower.UIScene = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function UIScene() {
    Phaser.Scene.call(this, { key: 'UIScene' });
  },

  init: function(data) {
    this.currentHealth = data.health || 3;
    this.currentScore = data.score || 0;
    this.currentLevel = data.level || 1;
    this.levelName = data.levelName || '';
  },

  create: function() {
    var w = TangledTower.GAME_WIDTH;

    // Hearts
    this.hearts = [];
    for (var i = 0; i < 3; i++) {
      var heartKey = this.textures.exists('heart') ? 'heart' : null;
      var heart;
      if (heartKey) {
        heart = this.add.sprite(12 + i * 14, 12, 'heart', 0).setScale(1.2);
      } else {
        heart = this.add.circle(12 + i * 14, 12, 5, 0xFF3344);
      }
      heart.setDepth(100);
      this.hearts.push(heart);
    }

    // Score text
    this.scoreText = this.add.text(w - 10, 6, 'SCORE: 0', {
      fontFamily: 'monospace',
      fontSize: '7px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(1, 0).setDepth(100);

    // Level text
    this.levelText = this.add.text(w - 10, 18, 'LEVEL ' + this.currentLevel, {
      fontFamily: 'monospace',
      fontSize: '6px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(1, 0).setDepth(100);

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
    if (data.score !== undefined) this.scoreText.setText('SCORE: ' + data.score);
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
  }
});
