// Tangled Tower - Victory Scene
var TangledTower = TangledTower || {};

TangledTower.VictoryScene = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function VictoryScene() {
    Phaser.Scene.call(this, { key: 'VictoryScene' });
  },

  init: function(data) {
    this.finalScore = data.score || 0;
    this.lives = data.lives || 3;
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
    if (this.textures.exists('tower')) {
      this.add.sprite(w / 2, h - 32, 'tower').setOrigin(0.5, 1);
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

    // Animated golden hair flowing down
    this.hairSegments = [];
    var hairStartX = w / 2;
    var hairStartY = h - 100;
    this._animateHair(hairStartX, hairStartY, h - 32);

    // Hero approaches tower
    var heroKey = this.textures.exists('hero') ? 'hero' : null;
    var hero = this.add.sprite(40, h - 42, heroKey, 0).setScale(1.5);
    if (heroKey) hero.play('hero-run');

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

  _animateHair: function(x, startY, endY) {
    var numSegments = 12;
    var segHeight = (endY - startY) / numSegments;
    var self = this;

    for (var i = 0; i < numSegments; i++) {
      this.time.delayedCall(i * 150, function(idx) {
        var y = startY + idx * segHeight;
        var wave = Math.sin(idx * 0.8) * 6;
        var hair = self.add.rectangle(x + wave, y + segHeight / 2, 4, segHeight + 2, 0xFFD700);
        self.hairSegments.push(hair);

        // Gentle swaying
        self.tweens.add({
          targets: hair,
          x: hair.x + 3,
          duration: 1000 + idx * 100,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }.bind(null, i));
    }
  },

  _showVictoryText: function() {
    if (this.victoryTextShown) return;
    this.victoryTextShown = true;

    var w = TangledTower.GAME_WIDTH;
    var h = TangledTower.GAME_HEIGHT;

    // Cutscene text
    var lines = TangledTower.VICTORY_TEXT;
    var lineY = 30;

    var self = this;
    for (var i = 0; i < lines.length; i++) {
      this.time.delayedCall(i * 1500, function(text, y) {
        var t = self.add.text(w / 2, y, text, {
          fontFamily: 'monospace',
          fontSize: i === lines.length - 1 ? '16px' : '8px',
          color: i === lines.length - 1 ? '#FFD700' : '#FFFFFF',
          stroke: '#000000',
          strokeThickness: 2,
          fontStyle: i === lines.length - 1 ? 'bold' : 'normal'
        }).setOrigin(0.5).setAlpha(0);

        self.tweens.add({
          targets: t,
          alpha: 1,
          duration: 500
        });
      }.bind(null, lines[i], lineY + i * 18));
    }

    // Score summary
    this.time.delayedCall(lines.length * 1500 + 500, function() {
      self.add.text(w / 2, h / 2 + 30, 'FINAL SCORE: ' + self.finalScore, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);

      // Play again
      var again = self.add.text(w / 2, h / 2 + 55, 'TAP TO PLAY AGAIN', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#FFFFFF',
        stroke: '#000000',
        strokeThickness: 1
      }).setOrigin(0.5);

      self.tweens.add({
        targets: again,
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
