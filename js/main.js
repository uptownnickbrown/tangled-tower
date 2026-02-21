// Tangled Tower - Main Game Configuration
var TangledTower = TangledTower || {};

// Launch the game when DOM is ready
window.addEventListener('load', function() {
  var config = {
    type: Phaser.AUTO,
    width: TangledTower.GAME_WIDTH,
    height: TangledTower.GAME_HEIGHT,
    parent: 'game-container',
    pixelArt: true,
    roundPixels: true,
    antialias: false,

    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },

    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },  // Gravity set per-object
        debug: false
      }
    },

    scene: [
      TangledTower.BootScene,
      TangledTower.TitleScene,
      TangledTower.CutsceneScene,
      TangledTower.GameScene,
      TangledTower.BossScene,
      TangledTower.UIScene,
      TangledTower.GameOverScene,
      TangledTower.VictoryScene
    ],

    input: {
      activePointers: 1
    },

    audio: {
      disableWebAudio: false
    }
  };

  TangledTower.game = new Phaser.Game(config);
});
