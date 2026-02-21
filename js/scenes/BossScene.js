// Tangled Tower - Boss Battle Scene
var TangledTower = TangledTower || {};

TangledTower.BossScene = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function BossScene() {
    Phaser.Scene.call(this, { key: 'BossScene' });
  },

  init: function(data) {
    this.levelIndex = data.level || 0;
    this.totalScore = data.score || 0;
    this.health = data.lives || 3;
  },

  create: function() {
    var w = TangledTower.GAME_WIDTH;
    var h = TangledTower.GAME_HEIGHT;
    var levelData = TangledTower.LEVELS[this.levelIndex];
    var bossData = levelData.boss;

    this.bossData = bossData;
    this.battleTimer = 0;
    this.nextAttackTime = 2000; // First attack after 2 seconds
    this.isInvincible = false;
    this.gameOver = false;
    this.bossDefeated = false;
    this.hasShield = false;

    // Background
    this.cameras.main.setBackgroundColor(levelData.skyColor);
    this.cameras.main.fadeIn(300);

    // Ground
    var groundGfx = this.add.graphics();
    groundGfx.fillStyle(0x55CC55, 1);
    groundGfx.fillRect(0, TangledTower.GROUND_Y, w, 4);
    groundGfx.fillStyle(0x885522, 1);
    groundGfx.fillRect(0, TangledTower.GROUND_Y + 4, w, h);

    // Ground physics
    this.groundBody = this.physics.add.staticImage(w / 2, TangledTower.GROUND_Y + 16, null);
    this.groundBody.setDisplaySize(w, 32).setVisible(false).refreshBody();

    // Hero
    var heroKey = this.textures.exists('hero') ? 'hero' : null;
    this.hero = this.physics.add.sprite(TangledTower.HERO_X, TangledTower.GROUND_Y - 16, heroKey, 0);
    this.hero.body.setGravityY(TangledTower.GRAVITY);
    this.hero.body.setSize(12, 16);
    this.hero.body.setOffset(2, 0);
    this.hero.setDepth(10);
    if (heroKey) this.hero.play('hero-run');

    this.physics.add.collider(this.hero, this.groundBody);

    // Boss sprite
    var bossKey = this.textures.exists(bossData.spriteKey) ? bossData.spriteKey : null;
    var bossX = w - 80;
    var bossY = TangledTower.GROUND_Y - 20;
    if (bossData.type === 'giant_bat' || bossData.type === 'dragon') {
      bossY = TangledTower.GROUND_Y - 50;
    }

    this.boss = this.add.sprite(bossX, bossY, bossKey, 0);
    this.boss.setScale(1.5);
    this.bossBaseX = bossX;
    this.bossBaseY = bossY;

    // Try to play idle animation
    var animPrefix = {
      troll: 'troll', vine_monster: 'vine', giant_bat: 'bat-boss',
      dark_knight: 'dknight', dragon: 'dragon'
    };
    this.bossAnimPrefix = animPrefix[bossData.type] || 'troll';
    try { this.boss.play(this.bossAnimPrefix + '-idle'); } catch (e) {}

    // Boss name
    this.add.text(w / 2, 15, bossData.name.toUpperCase(), {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#FF4444',
      stroke: '#000000',
      strokeThickness: 2,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(50);

    // Progress bar background
    var barX = w / 2 - 80;
    var barY = 28;
    this.add.rectangle(w / 2, barY, 164, 8, 0x333333).setDepth(50);
    this.progressBar = this.add.rectangle(barX + 2, barY, 0, 4, 0x44FF44)
      .setOrigin(0, 0.5).setDepth(51);

    // Projectile pool
    this.projectiles = this.physics.add.group({ allowGravity: false, maxSize: 20 });
    this.physics.add.overlap(this.hero, this.projectiles, this._hitProjectile, null, this);

    // Boss body overlap (for swoops/charges)
    this.bossHitbox = this.physics.add.sprite(bossX, bossY, null).setVisible(false);
    this.bossHitbox.body.setSize(30, 30);
    this.bossHitbox.body.allowGravity = false;
    this.bossHitbox.body.enable = false;
    this.physics.add.overlap(this.hero, this.bossHitbox, this._hitBossBody, null, this);

    // Warning icon pool
    this.warningIcons = [];

    // Shield bubble
    this.shieldBubble = this.add.circle(0, 0, 12, 0x44DDFF, 0.3).setVisible(false).setDepth(11);

    // Input
    TangledTower.InputManager.setup(this);

    // HUD
    this.scene.launch('UIScene', {
      health: this.health,
      score: this.totalScore,
      level: levelData.id,
      levelName: levelData.name
    });

    // Boss music
    TangledTower.AudioGen.startMusic(5); // Boss music is index 5

    // Entrance animation
    this.boss.setAlpha(0);
    this.tweens.add({
      targets: this.boss,
      alpha: 1,
      duration: 800,
      ease: 'Quad.easeIn'
    });
  },

  update: function(time, delta) {
    if (this.gameOver || this.bossDefeated) return;

    var dt = delta / 1000;
    this.battleTimer += delta;

    // Update progress bar
    var progress = this.battleTimer / (this.bossData.duration * 1000);
    this.progressBar.width = Math.min(progress, 1) * 160;

    // Check victory
    if (this.battleTimer >= this.bossData.duration * 1000) {
      this._defeatBoss();
      return;
    }

    // Schedule attacks
    if (this.battleTimer >= this.nextAttackTime) {
      this._doAttack();
      this.nextAttackTime = this.battleTimer + this.bossData.attackInterval * 1000;
    }

    // Update boss hitbox position
    this.bossHitbox.setPosition(this.boss.x, this.boss.y);

    // Scroll projectiles
    this.projectiles.getChildren().forEach(function(p) {
      if (p.active && (p.x < -20 || p.x > 500 || p.y > 300)) {
        p.setActive(false).setVisible(false);
        p.body.enable = false;
      }
    });

    // Input
    TangledTower.InputManager.update(this);

    // Shield visual
    if (this.hasShield) {
      this.shieldBubble.setPosition(this.hero.x, this.hero.y).setVisible(true);
    }

    // Update HUD
    this.events.emit('updateHUD', {
      health: this.health,
      score: this.totalScore
    });
  },

  _doAttack: function() {
    var attacks = this.bossData.attacks;
    var attackKey = Phaser.Utils.Array.GetRandom(attacks);

    // Show warning first
    this._showWarning(attackKey);

    var self = this;
    var delay = 1200; // Telegraph delay

    this.time.delayedCall(delay, function() {
      if (self.gameOver || self.bossDefeated) return;

      try { self.boss.play(self.bossAnimPrefix + '-attack'); } catch (e) {}
      TangledTower.AudioGen.playBossAttack();

      switch (attackKey) {
        case 'ground_pound':
        case 'sword_slash':
        case 'tail_sweep':
          self._attackGroundWave();
          break;

        case 'rock_throw':
        case 'thorn_rain':
        case 'sonic_screech':
        case 'dark_bolt':
          self._attackProjectileHigh();
          break;

        case 'fireball':
          self._attackProjectileLow();
          break;

        case 'fire_breath':
          self._attackFireBreath();
          break;

        case 'vine_whip':
        case 'charge':
          self._attackCharge();
          break;

        case 'swoop':
        case 'dive_bomb':
          self._attackSwoop();
          break;

        case 'bat_swarm':
          self._attackMultiProjectile();
          break;
      }

      // Return to idle after attack
      self.time.delayedCall(600, function() {
        if (!self.gameOver && !self.bossDefeated) {
          try { self.boss.play(self.bossAnimPrefix + '-idle'); } catch (e) {}
        }
      });
    });
  },

  _showWarning: function(attackType) {
    TangledTower.AudioGen.playBossWarning();

    // Determine warning position based on attack type
    var groundAttacks = ['ground_pound', 'sword_slash', 'tail_sweep', 'fireball', 'fire_breath'];
    var isGround = groundAttacks.indexOf(attackType) !== -1;

    var warnY = isGround ? TangledTower.GROUND_Y - 30 : TangledTower.GROUND_Y - 55;
    var warnX = TangledTower.HERO_X + 30;

    // Red "!" warning
    var warn = this.add.text(warnX, warnY, '!', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#FF0000',
      stroke: '#000000',
      strokeThickness: 2,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(30);

    // Arrow indicating where to dodge
    var hintText = isGround ? 'JUMP!' : 'CROUCH!';
    var hint = this.add.text(warnX, warnY + 14, hintText, {
      fontFamily: 'monospace',
      fontSize: '6px',
      color: '#FFFF00',
      stroke: '#000000',
      strokeThickness: 1
    }).setOrigin(0.5).setDepth(30);

    // Flash and remove
    this.tweens.add({
      targets: [warn, hint],
      alpha: { from: 1, to: 0.3 },
      duration: 200,
      yoyo: true,
      repeat: 2,
      onComplete: function() {
        warn.destroy();
        hint.destroy();
      }
    });
  },

  // Attack patterns - all create projectiles that hero must dodge

  _attackGroundWave: function() {
    // Shockwave along the ground - JUMP to avoid
    var fbKey = this.textures.exists('fireball') ? 'fireball' : null;
    var wave = this.projectiles.get(this.boss.x - 20, TangledTower.GROUND_Y - 6, fbKey, 0);
    if (wave) {
      wave.setActive(true).setVisible(true).setTint(0xFF6622);
      wave.body.enable = true;
      wave.body.velocity.x = -200;
      wave.body.setSize(12, 8);
      if (fbKey) wave.play('fireball-burn');
    }
  },

  _attackProjectileHigh: function() {
    // Projectile at head height - CROUCH to avoid
    var fbKey = this.textures.exists('fireball') ? 'fireball' : null;
    var proj = this.projectiles.get(this.boss.x - 20, TangledTower.GROUND_Y - 20, fbKey, 0);
    if (proj) {
      proj.setActive(true).setVisible(true).setTint(0x8844FF);
      proj.body.enable = true;
      proj.body.velocity.x = -180;
      proj.body.setSize(8, 8);
      if (fbKey) proj.play('fireball-burn');
    }
  },

  _attackProjectileLow: function() {
    // Fireball at ground level - JUMP to avoid
    var fbKey = this.textures.exists('fireball') ? 'fireball' : null;
    var proj = this.projectiles.get(this.boss.x - 20, TangledTower.GROUND_Y - 8, fbKey, 0);
    if (proj) {
      proj.setActive(true).setVisible(true).setTint(0xFF4400);
      proj.body.enable = true;
      proj.body.velocity.x = -220;
      proj.body.setSize(8, 8);
      if (fbKey) proj.play('fireball-burn');
    }
  },

  _attackFireBreath: function() {
    // Multiple fireballs in sequence at ground level - must jump and stay up
    var self = this;
    var fbKey = this.textures.exists('fireball') ? 'fireball' : null;
    for (var i = 0; i < 5; i++) {
      this.time.delayedCall(i * 250, function() {
        if (self.gameOver || self.bossDefeated) return;
        var proj = self.projectiles.get(self.boss.x - 20, TangledTower.GROUND_Y - 6, fbKey, 0);
        if (proj) {
          proj.setActive(true).setVisible(true).setTint(0xFF6600);
          proj.body.enable = true;
          proj.body.velocity.x = -250;
          proj.body.setSize(8, 8);
          if (fbKey) proj.play('fireball-burn');
        }
      });
    }
  },

  _attackCharge: function() {
    // Boss charges across the screen - JUMP to avoid
    var startX = this.boss.x;
    var startY = this.boss.y;

    this.bossHitbox.body.enable = true;
    var self = this;

    this.tweens.add({
      targets: this.boss,
      x: 40,
      duration: 800,
      ease: 'Quad.easeIn',
      onComplete: function() {
        self.bossHitbox.body.enable = false;
        self.tweens.add({
          targets: self.boss,
          x: startX,
          y: startY,
          duration: 600,
          ease: 'Quad.easeOut'
        });
      }
    });
  },

  _attackSwoop: function() {
    // Boss swoops down from above - CROUCH to avoid
    var startX = this.boss.x;
    var startY = this.boss.y;

    this.bossHitbox.body.enable = true;
    var self = this;

    this.tweens.add({
      targets: this.boss,
      x: TangledTower.HERO_X + 20,
      y: TangledTower.GROUND_Y - 18,
      duration: 600,
      ease: 'Quad.easeIn',
      onComplete: function() {
        self.bossHitbox.body.enable = false;
        self.tweens.add({
          targets: self.boss,
          x: startX,
          y: startY,
          duration: 800,
          ease: 'Quad.easeOut'
        });
      }
    });
  },

  _attackMultiProjectile: function() {
    // Multiple projectiles at different heights
    var self = this;
    var fbKey = this.textures.exists('fireball') ? 'fireball' : null;
    var heights = [TangledTower.GROUND_Y - 8, TangledTower.GROUND_Y - 22, TangledTower.GROUND_Y - 36];

    for (var i = 0; i < 3; i++) {
      this.time.delayedCall(i * 400, function(idx) {
        if (self.gameOver || self.bossDefeated) return;
        var proj = self.projectiles.get(self.boss.x - 20, heights[idx], fbKey, 0);
        if (proj) {
          proj.setActive(true).setVisible(true).setTint(0xAA44FF);
          proj.body.enable = true;
          proj.body.velocity.x = -160;
          proj.body.setSize(8, 8);
          if (fbKey) proj.play('fireball-burn');
        }
      }.bind(null, i));
    }
  },

  _hitProjectile: function(hero, proj) {
    if (!proj.active) return;
    proj.setActive(false).setVisible(false);
    proj.body.enable = false;
    this._takeDamage();
  },

  _hitBossBody: function(hero, bossHitbox) {
    this._takeDamage();
  },

  _takeDamage: function() {
    if (this.isInvincible || this.gameOver) return;

    if (this.hasShield) {
      this.hasShield = false;
      this.shieldBubble.setVisible(false);
      TangledTower.AudioGen.playHit();
      return;
    }

    this.health--;
    TangledTower.AudioGen.playHit();

    if (this.health <= 0) {
      this._die();
      return;
    }

    // Invincibility
    this.isInvincible = true;
    var self = this;
    this.tweens.add({
      targets: this.hero,
      alpha: { from: 0.2, to: 1 },
      duration: 120,
      repeat: 6,
      yoyo: true,
      onComplete: function() {
        self.isInvincible = false;
        self.hero.alpha = 1;
      }
    });

    this.hero.play('hero-hurt');
    this.time.delayedCall(300, function() {
      if (!self.gameOver) self.hero.play('hero-run', true);
    });

    this.cameras.main.shake(200, 0.015);
  },

  _die: function() {
    this.gameOver = true;
    TangledTower.InputManager.enabled = false;
    TangledTower.AudioGen.stopMusic();
    TangledTower.AudioGen.playGameOver();

    this.hero.play('hero-hurt');
    this.hero.body.enable = false;

    var self = this;
    this.tweens.add({
      targets: this.hero,
      y: TangledTower.GAME_HEIGHT + 30,
      alpha: 0,
      duration: 800,
      onComplete: function() {
        self.cameras.main.fadeOut(500);
        self.time.delayedCall(1000, function() {
          self.scene.stop('UIScene');
          self.scene.start('GameOverScene', {
            level: self.levelIndex,
            score: self.totalScore
          });
        });
      }
    });
  },

  _defeatBoss: function() {
    this.bossDefeated = true;
    TangledTower.AudioGen.stopMusic();
    TangledTower.AudioGen.playBossDefeat();

    // Disable all projectiles
    this.projectiles.getChildren().forEach(function(p) {
      p.setActive(false).setVisible(false);
    });
    this.bossHitbox.body.enable = false;

    // Boss defeat animation
    var self = this;
    this.tweens.add({
      targets: this.boss,
      alpha: { from: 1, to: 0 },
      scaleX: { from: 1.5, to: 2 },
      scaleY: { from: 1.5, to: 0.1 },
      duration: 1000,
      ease: 'Quad.easeIn'
    });

    // Particles
    for (var i = 0; i < 15; i++) {
      var p = this.add.circle(
        this.boss.x + Phaser.Math.Between(-20, 20),
        this.boss.y + Phaser.Math.Between(-20, 20),
        3, 0xFFDD00
      );
      this.tweens.add({
        targets: p,
        x: p.x + Phaser.Math.Between(-40, 40),
        y: p.y + Phaser.Math.Between(-50, -10),
        alpha: 0,
        duration: 600,
        delay: i * 50,
        onComplete: function() { p.destroy(); }
      });
    }

    // Score bonus
    this.totalScore += 500;

    // "BOSS DEFEATED!" text
    var defeatText = this.add.text(TangledTower.GAME_WIDTH / 2, TangledTower.GAME_HEIGHT / 2 - 20, 'BOSS DEFEATED!', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(50);

    this.tweens.add({
      targets: defeatText,
      scale: { from: 0.5, to: 1.2 },
      duration: 500,
      yoyo: true
    });

    // Transition
    this.time.delayedCall(2500, function() {
      self.cameras.main.fadeOut(500);
      self.time.delayedCall(500, function() {
        self.scene.stop('UIScene');

        if (self.levelIndex >= TangledTower.LEVELS.length - 1) {
          // Game complete!
          self.scene.start('VictoryScene', {
            score: self.totalScore,
            lives: self.health
          });
        } else {
          // Next level
          self.scene.start('CutsceneScene', {
            level: self.levelIndex + 1,
            score: self.totalScore,
            lives: self.health
          });
        }
      });
    });
  },

  // Callbacks for InputManager
  onCrouchStart: function() {},
  onCrouchEnd: function() {},

  shutdown: function() {
    TangledTower.InputManager.reset();
  }
});
