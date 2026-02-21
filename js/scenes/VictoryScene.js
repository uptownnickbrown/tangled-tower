// Tangled Tower - Victory Scene
var TangledTower = TangledTower || {};

TangledTower.VictoryScene = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function VictoryScene() {
    Phaser.Scene.call(this, { key: 'VictoryScene' });
  },

  init: function(data) {
    this.finalScore = data.score || 0;
    this.lives = data.lives || TangledTower.STARTING_LIVES;
  },

  create: function() {
    var w = TangledTower.GAME_WIDTH;
    var h = TangledTower.GAME_HEIGHT;

    this.cameras.main.setBackgroundColor(0x111133);
    this.cameras.main.fadeIn(800);

    // Stars in the night sky
    for (var i = 0; i < 30; i++) {
      var star = this.add.circle(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h / 2),
        Phaser.Math.Between(1, 2),
        0xFFFFFF
      );
      this.tweens.add({
        targets: star,
        alpha: { from: 0.3, to: 1 },
        duration: Phaser.Math.Between(500, 2000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 1000)
      });
    }

    // Moon
    this.add.circle(w - 60, 40, 20, 0xFFFFCC);
    this.add.circle(w - 55, 36, 15, 0x111133); // Crescent effect

    // Ground
    var gfx = this.add.graphics();
    gfx.fillStyle(0x224422, 1);
    gfx.fillRect(0, h - 32, w, 4);
    gfx.fillStyle(0x332211, 1);
    gfx.fillRect(0, h - 28, w, 28);

    // Tower
    var towerScale = TangledTower.TOWER_SCALE || 0.31;
    if (this.textures.exists('tower')) {
      this.add.sprite(w / 2, h - 32, 'tower').setOrigin(0.5, 1).setScale(towerScale);
    } else {
      // Draw a simple tower
      gfx.fillStyle(0x888888, 1);
      gfx.fillRect(w / 2 - 20, h - 112, 40, 80);
      gfx.fillStyle(0x666666, 1);
      gfx.fillRect(w / 2 - 24, h - 116, 48, 8);
      // Window
      gfx.fillStyle(0x222222, 1);
      gfx.fillRect(w / 2 - 6, h - 108, 12, 14);
    }

    // Hero approaches tower
    var heroKey = this.textures.exists('hero_run1') ? 'hero_run1' :
                  (this.textures.exists('hero_run') ? 'hero_run' : 'hero');
    var heroScale = (TangledTower.HERO_SCALE || 0.32) * 1.5;
    var hero = this.add.sprite(40, h - 42, heroKey).setScale(heroScale);
    hero.play('hero-run');

    // Walk hero to tower
    var self = this;
    this.tweens.add({
      targets: hero,
      x: w / 2 - 30,
      duration: 3000,
      ease: 'Linear',
      onComplete: function() {
        hero.setFrame(0);
        if (hero.anims) hero.stop();

        // Hero climbs (move up alongside tower)
        self.tweens.add({
          targets: hero,
          y: h - 100,
          duration: 2000,
          ease: 'Linear',
          onComplete: function() {
            self._showVictoryText();
          }
        });
      }
    });

    // Victory text appears later
    this.victoryTextShown = false;

    // Play victory music
    TangledTower.AudioGen.playVictory();
  },

  _showVictoryText: function() {
    if (this.victoryTextShown) return;
    this.victoryTextShown = true;

    var w = TangledTower.GAME_WIDTH;
    var h = TangledTower.GAME_HEIGHT;

    // Cutscene text
    var lines = TangledTower.VICTORY_TEXT;
    var lineY = 30;
    var totalLines = lines.length;

    var self = this;
    for (var i = 0; i < lines.length; i++) {
      this.time.delayedCall(i * 1500, function(text, y, idx) {
        var isLast = idx === totalLines - 1;
        var size = isLast ? 16 : 8;
        var tint = isLast ? 0xFFD700 : 0xFFFFFF;
        var t = TangledTower.bmpText(self, w / 2, y, text, size, tint);
        t.setAlpha(0);
        if (t._shadow) t._shadow.setAlpha(0);

        self.tweens.add({
          targets: [t, t._shadow],
          alpha: 1,
          duration: 500
        });
      }.bind(null, lines[i], lineY + i * 18, i));
    }

    // Score summary
    this.time.delayedCall(lines.length * 1500 + 500, function() {
      TangledTower.bmpText(self, w / 2, h / 2 + 30, 'FINAL SCORE: ' + self.finalScore, 16, 0xFFD700);

      // Play again
      var again = TangledTower.bmpText(self, w / 2, h / 2 + 55, 'TAP TO PLAY AGAIN', 8, 0xFFFFFF);

      self.tweens.add({
        targets: [again, again._shadow],
        alpha: 0.3,
        duration: 500,
        yoyo: true,
        repeat: -1
      });

      var restarted = false;
      var restart = function() {
        if (restarted) return;
        restarted = true;
        TangledTower.AudioGen.playMenuSelect();
        self.cameras.main.fadeOut(500);
        self.time.delayedCall(500, function() {
          self.scene.start('TitleScene');
        });
      };

      self.input.on('pointerdown', restart);
      self.input.keyboard.on('keydown-SPACE', restart);
    });
  }
});
