// Tangled Tower - Boss Battle Scene (HP-based, dodge-to-damage)
var TangledTower = TangledTower || {};

TangledTower.BossScene = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function BossScene() {
    Phaser.Scene.call(this, { key: 'BossScene' });
  },

  init: function(data) {
    this.levelIndex = data.level || 0;
    this.totalScore = data.score || 0;
    this.health = data.lives || TangledTower.STARTING_LIVES;
  },

  create: function() {
    var w = TangledTower.GAME_WIDTH;
    var h = TangledTower.GAME_HEIGHT;
    var levelData = TangledTower.LEVELS[this.levelIndex];
    var bossData = levelData.boss;

    this.bossData = bossData;
    this.isInvincible = false;
    this.gameOver = false;
    this.bossDefeated = false;
    this.hasShield = false;

    // Boss HP system
    this.bossMaxHP = bossData.hp || 8;
    this.bossHP = this.bossMaxHP;
    this.currentPhaseIndex = 0;
    this.comboCount = 0;

    // Attack tracking for dodge detection
    this._attackActive = false;
    this._wasHitThisAttack = false;
    this._attackCheckTimers = [];

    // Get current phase
    this._updatePhase();

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
    var heroKey = this.textures.exists('hero_run1') ? 'hero_run1' :
                  (this.textures.exists('hero_run') ? 'hero_run' : 'hero');
    var heroScale = TangledTower.HERO_SCALE || 0.32;
    this.hero = this.physics.add.sprite(TangledTower.HERO_X, TangledTower.GROUND_Y - 20, heroKey);
    this.hero.setScale(heroScale);
    this.hero.body.setGravityY(TangledTower.GRAVITY);
    var heroW = this.hero.displayWidth * 0.5;
    var heroH = this.hero.displayHeight * 0.85;
    this.hero.body.setSize(heroW / heroScale, heroH / heroScale);
    this.hero.body.setOffset(
      (this.hero.width - heroW / heroScale) / 2,
      this.hero.height - heroH / heroScale
    );
    this.hero.setDepth(10);
    this.hero.play('hero-run');

    this.physics.add.collider(this.hero, this.groundBody);

    // Boss sprite
    var aiKey = bossData.spriteKey.replace('-', '_');
    var bossKey = this.textures.exists(aiKey) ? aiKey :
                  (this.textures.exists(bossData.spriteKey) ? bossData.spriteKey : null);
    var isAIBoss = bossKey && bossKey.indexOf('_') !== -1;
    var bossScale = isAIBoss ? (TangledTower.BOSS_SCALE || 0.31) : 1.5;
    var bossX = w - 80;
    var bossY = TangledTower.GROUND_Y - 20;
    if (bossData.type === 'giant_bat' || bossData.type === 'dragon') {
      bossY = TangledTower.GROUND_Y - 50;
    }

    this.boss = this.add.sprite(bossX, bossY, bossKey, isAIBoss ? undefined : 0);
    this.boss.setScale(bossScale);
    if (isAIBoss) {
      this.boss.setOrigin(0.5, 1);
      this.boss.y = TangledTower.GROUND_Y;
    }
    this.bossBaseX = bossX;
    this.bossBaseY = isAIBoss ? TangledTower.GROUND_Y : bossY;

    // Boss animation prefix
    var animPrefix = {
      troll: 'troll', vine_monster: 'vine', giant_bat: 'bat-boss',
      dark_knight: 'dknight', dragon: 'dragon'
    };
    this.bossAnimPrefix = animPrefix[bossData.type] || 'troll';
    try { this.boss.play(this.bossAnimPrefix + '-idle'); } catch (e) {}

    // === BOSS HP BAR ===
    var barWidth = 160;
    var barX = w / 2 - barWidth / 2;
    var barY = 12;

    // Boss name above bar
    TangledTower.bmpText(this, w / 2, barY - 4, bossData.name, 8, 0xFF4444, 50);

    // Bar background
    this.add.rectangle(w / 2, barY + 8, barWidth + 4, 10, 0x222222).setDepth(49);
    this.add.rectangle(w / 2, barY + 8, barWidth + 2, 8, 0x444444).setDepth(49);

    // HP fill bar
    this.hpBar = this.add.rectangle(barX + 1, barY + 8, barWidth, 6, 0xFF2222)
      .setOrigin(0, 0.5).setDepth(50);
    this.hpBarWidth = barWidth;

    // Phase markers on HP bar
    var phases = bossData.phases || [];
    for (var pi = 1; pi < phases.length; pi++) {
      var threshold = phases[pi].hpThreshold;
      var markerX = barX + 1 + barWidth * (1 - threshold);
      this.add.rectangle(markerX, barY + 8, 2, 10, 0xFFFFFF).setDepth(51).setAlpha(0.5);
    }

    // Combo text (hidden initially)
    this.comboText = this.add.bitmapText(w / 2, barY + 22, 'pixel-font-gold', '', 8)
      .setOrigin(0.5).setDepth(50).setAlpha(0);

    // Projectile pool
    this.projectiles = this.physics.add.group({ allowGravity: false, maxSize: 20 });
    this.physics.add.overlap(this.hero, this.projectiles, this._hitProjectile, null, this);

    // Boss body overlap (for swoops/charges)
    this.bossHitbox = this.physics.add.sprite(bossX, bossY, null).setVisible(false);
    var bossHitSize = isAIBoss ? this.boss.displayWidth * 0.6 : 30;
    this.bossHitbox.body.setSize(bossHitSize, bossHitSize);
    this.bossHitbox.body.allowGravity = false;
    this.bossHitbox.body.enable = false;
    this.physics.add.overlap(this.hero, this.bossHitbox, this._hitBossBody, null, this);

    // Danger zone graphics (reusable)
    this.dangerZone = this.add.graphics().setDepth(4);

    // Shield bubble
    this.shieldBubble = this.add.circle(0, 0, 22, 0x44DDFF, 0.25).setVisible(false).setDepth(11);
    this.tweens.add({
      targets: this.shieldBubble,
      scaleX: { from: 1, to: 1.15 },
      scaleY: { from: 1, to: 1.15 },
      alpha: { from: 0.25, to: 0.15 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

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
    TangledTower.AudioGen.startMusic(5);

    // Battle timer for scheduling attacks
    this.battleTimer = 0;
    this.nextAttackTime = 2000;

    // Entrance animation
    this.boss.setAlpha(0);
    var self = this;
    this.tweens.add({
      targets: this.boss,
      alpha: 1,
      duration: 800,
      ease: 'Quad.easeIn',
      onComplete: function() {
        // Show "FIGHT!" text
        var fightText = TangledTower.bmpText(self, w / 2, h / 2 - 20, 'FIGHT!', 24, 0xFFD700, 60);
        self.tweens.add({
          targets: [fightText, fightText._shadow],
          alpha: 0,
          scale: 2,
          duration: 800,
          onComplete: function() {
            fightText.destroy();
            if (fightText._shadow) fightText._shadow.destroy();
          }
        });
      }
    });
  },

  update: function(time, delta) {
    if (this.gameOver || this.bossDefeated) return;

    this.battleTimer += delta;

    // Update boss HP bar
    var hpRatio = this.bossHP / this.bossMaxHP;
    this.hpBar.width = Math.max(0, hpRatio * this.hpBarWidth);

    // HP bar color: green > yellow > red as HP depletes
    if (hpRatio > 0.6) {
      this.hpBar.fillColor = 0x44CC44;
    } else if (hpRatio > 0.3) {
      this.hpBar.fillColor = 0xFFAA22;
    } else {
      this.hpBar.fillColor = 0xFF2222;
    }

    // Schedule attacks
    if (this.battleTimer >= this.nextAttackTime) {
      this._doAttack();
      var phase = this._getCurrentPhase();
      this.nextAttackTime = this.battleTimer + phase.attackInterval * 1000;
    }

    // Update boss hitbox position
    this.bossHitbox.setPosition(this.boss.x, this.boss.y);

    // Scroll projectiles and check dodge
    var self = this;
    var heroX = TangledTower.HERO_X;
    this.projectiles.getChildren().forEach(function(p) {
      if (p.active) {
        if (p.x < -20 || p.x > 500 || p.y > 300) {
          p.setActive(false).setVisible(false);
          p.body.enable = false;
        }
        // Dodge detection: projectile passed hero
        if (p.active && p._dodgeChecked !== true && p.x < heroX - 20) {
          p._dodgeChecked = true;
          self._onProjectileDodged();
        }
      }
    });

    // Safety: prevent hero from falling through ground
    if (this.hero && this.hero.y > TangledTower.GROUND_Y + 30) {
      this.hero.y = TangledTower.GROUND_Y - 10;
      this.hero.body.velocity.y = 0;
    }

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

  // === PHASE MANAGEMENT ===

  _getCurrentPhase: function() {
    var phases = this.bossData.phases || [];
    if (phases.length === 0) {
      return { attackInterval: 2.5, attacks: ['ground_pound'] };
    }
    return phases[this.currentPhaseIndex] || phases[phases.length - 1];
  },

  _updatePhase: function() {
    var phases = this.bossData.phases || [];
    var hpRatio = this.bossHP / this.bossMaxHP;
    // Phases are ordered by threshold descending (1.0, 0.5, 0.3).
    // Start at phase 0. Advance to phase i if hpRatio < threshold[i].
    var newPhaseIndex = 0;
    for (var i = 1; i < phases.length; i++) {
      if (hpRatio <= phases[i].hpThreshold) {
        newPhaseIndex = i;
      }
    }
    if (newPhaseIndex !== this.currentPhaseIndex) {
      this.currentPhaseIndex = newPhaseIndex;
      this._phaseTransition(newPhaseIndex + 1);
    }
  },

  _phaseTransition: function(phaseNum) {
    var w = TangledTower.GAME_WIDTH;
    var h = TangledTower.GAME_HEIGHT;

    // Boss staggers
    var self = this;
    this.boss.setTint(0xFF0000);
    this.cameras.main.shake(500, 0.02);

    // "PHASE X!" text
    var phaseText = TangledTower.bmpText(this, w / 2, h / 2 - 10, 'PHASE ' + phaseNum + '!', 16, 0xFF4444, 60);
    this.tweens.add({
      targets: [phaseText, phaseText._shadow],
      alpha: 0,
      scale: 1.5,
      duration: 1200,
      onComplete: function() {
        phaseText.destroy();
        if (phaseText._shadow) phaseText._shadow.destroy();
      }
    });

    // Brief pause before attacks resume
    this.nextAttackTime = this.battleTimer + 2000;

    // Flash boss back to normal
    this.time.delayedCall(600, function() {
      if (!self.gameOver && !self.bossDefeated) {
        self.boss.clearTint();
      }
    });

    // Boss speed-up particles
    for (var i = 0; i < 8; i++) {
      var p = this.add.circle(
        this.boss.x + Phaser.Math.Between(-30, 30),
        this.boss.y + Phaser.Math.Between(-30, 10),
        2, 0xFF4444
      );
      this.tweens.add({
        targets: p,
        y: p.y - 40,
        alpha: 0,
        duration: 500,
        delay: i * 50,
        onComplete: function() { p.destroy(); }
      });
    }
  },

  // === ATTACK SYSTEM ===

  _doAttack: function() {
    var phase = this._getCurrentPhase();
    var attacks = phase.attacks;
    var attackKey = Phaser.Utils.Array.GetRandom(attacks);

    // Reset dodge tracking
    this._wasHitThisAttack = false;

    // Show danger zone + warning
    this._showDangerZone(attackKey);

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

  _showDangerZone: function(attackType) {
    TangledTower.AudioGen.playBossWarning();

    var w = TangledTower.GAME_WIDTH;
    var groundY = TangledTower.GROUND_Y;
    var heroX = TangledTower.HERO_X;

    // Determine danger zone type
    var groundAttacks = ['ground_pound', 'sword_slash', 'tail_sweep', 'fireball', 'fire_breath'];
    var chargeAttacks = ['vine_whip', 'charge'];
    var swoopAttacks = ['swoop', 'dive_bomb'];
    var isGround = groundAttacks.indexOf(attackType) !== -1;
    var isCharge = chargeAttacks.indexOf(attackType) !== -1;
    var isSwoop = swoopAttacks.indexOf(attackType) !== -1;

    var gfx = this.dangerZone;
    gfx.clear();

    var self = this;
    var flashCount = 0;

    // Warning hint text
    var hintText = isGround ? 'JUMP!' : (isSwoop ? 'CROUCH!' : (isCharge ? 'JUMP!' : 'CROUCH!'));
    var hintColor = isGround || isCharge ? 0xFF4444 : 0xFF8800;
    var hint = TangledTower.bmpText(this, heroX + 40, groundY - 50, hintText, 16, hintColor, 55);

    // Flash danger zone 3 times
    var flashTimer = this.time.addEvent({
      delay: 200,
      repeat: 5,
      callback: function() {
        flashCount++;
        gfx.clear();
        if (flashCount % 2 === 1) {
          gfx.fillStyle(hintColor, 0.2);
          if (isGround) {
            // Ground-level danger
            gfx.fillRect(0, groundY - 14, w, 14);
          } else if (isCharge) {
            // Full-width low stripe
            gfx.fillRect(0, groundY - 40, w, 40);
          } else if (isSwoop) {
            // Head-height zone near hero
            gfx.fillRect(heroX - 30, groundY - 45, 100, 20);
          } else {
            // High projectile zone
            gfx.fillRect(0, groundY - 40, w, 16);
          }
        }
        if (flashCount >= 6) {
          gfx.clear();
          hint.destroy();
          if (hint._shadow) hint._shadow.destroy();
        }
      }
    });
  },

  // === ATTACK PATTERNS ===

  _attackGroundWave: function() {
    var fbKey = this.textures.exists('fireball') ? 'fireball' : null;
    var wave = this.projectiles.get(this.boss.x - 20, TangledTower.GROUND_Y - 6, fbKey, 0);
    if (wave) {
      wave.setActive(true).setVisible(true).setTint(0xFF6622);
      wave.body.enable = true;
      wave.body.velocity.x = -200;
      wave.body.setSize(12, 8);
      wave._dodgeChecked = false;
      if (fbKey) try { wave.play('fireball-burn'); } catch(e) {}
    }
  },

  _attackProjectileHigh: function() {
    // Projectile at head height - CROUCH to avoid (raised higher so crouch works)
    var fbKey = this.textures.exists('fireball') ? 'fireball' : null;
    var proj = this.projectiles.get(this.boss.x - 20, TangledTower.GROUND_Y - 30, fbKey, 0);
    if (proj) {
      proj.setActive(true).setVisible(true).setTint(0x8844FF);
      proj.body.enable = true;
      proj.body.velocity.x = -180;
      proj.body.setSize(8, 8);
      proj._dodgeChecked = false;
      if (fbKey) try { proj.play('fireball-burn'); } catch(e) {}
    }
  },

  _attackProjectileLow: function() {
    var fbKey = this.textures.exists('fireball') ? 'fireball' : null;
    var proj = this.projectiles.get(this.boss.x - 20, TangledTower.GROUND_Y - 8, fbKey, 0);
    if (proj) {
      proj.setActive(true).setVisible(true).setTint(0xFF4400);
      proj.body.enable = true;
      proj.body.velocity.x = -220;
      proj.body.setSize(8, 8);
      proj._dodgeChecked = false;
      if (fbKey) try { proj.play('fireball-burn'); } catch(e) {}
    }
  },

  _attackFireBreath: function() {
    var self = this;
    var fbKey = this.textures.exists('fireball') ? 'fireball' : null;
    for (var i = 0; i < 5; i++) {
      this.time.delayedCall(i * 250, function(idx) {
        if (self.gameOver || self.bossDefeated) return;
        var proj = self.projectiles.get(self.boss.x - 20, TangledTower.GROUND_Y - 6, fbKey, 0);
        if (proj) {
          proj.setActive(true).setVisible(true).setTint(0xFF6600);
          proj.body.enable = true;
          proj.body.velocity.x = -250;
          proj.body.setSize(8, 8);
          proj._dodgeChecked = false;
          if (fbKey) try { proj.play('fireball-burn'); } catch(e) {}
        }
      }.bind(null, i));
    }
  },

  _attackCharge: function() {
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
        // Dodge check: charge passed hero
        if (!self._wasHitThisAttack) {
          self._onProjectileDodged();
        }
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
        // Dodge check: swoop completed
        if (!self._wasHitThisAttack) {
          self._onProjectileDodged();
        }
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
          proj._dodgeChecked = false;
          if (fbKey) try { proj.play('fireball-burn'); } catch(e) {}
        }
      }.bind(null, i));
    }
  },

  // === DODGE DETECTION ===

  _onProjectileDodged: function() {
    if (this._wasHitThisAttack || this.gameOver || this.bossDefeated) return;

    // Successful dodge damages boss
    this.comboCount++;
    this._bossHit();
  },

  _bossHit: function() {
    if (this.bossDefeated) return;

    this.bossHP--;
    TangledTower.AudioGen.playDodgeSuccess();
    TangledTower.AudioGen.playBossHurt();

    var w = TangledTower.GAME_WIDTH;

    // Boss flinch
    this.boss.setTint(0xFF0000);
    var bossBaseY = this.boss.y;
    var self = this;
    this.tweens.add({
      targets: this.boss,
      y: bossBaseY - 5,
      duration: 80,
      yoyo: true,
      onComplete: function() {
        if (!self.bossDefeated) self.boss.clearTint();
      }
    });

    // "+HIT!" popup
    var hitText = this.add.bitmapText(this.boss.x, this.boss.y - 30, 'pixel-font-gold', '+HIT!', 8)
      .setOrigin(0.5).setDepth(55);
    this.tweens.add({
      targets: hitText,
      y: this.boss.y - 60,
      alpha: 0,
      duration: 700,
      onComplete: function() { hitText.destroy(); }
    });

    // Damage particles on boss
    for (var i = 0; i < 6; i++) {
      var part = this.add.circle(
        this.boss.x + Phaser.Math.Between(-15, 15),
        this.boss.y + Phaser.Math.Between(-20, 0),
        2, 0xFFDD00
      );
      this.tweens.add({
        targets: part,
        x: part.x + Phaser.Math.Between(-20, 20),
        y: part.y - Phaser.Math.Between(10, 30),
        alpha: 0,
        duration: 400,
        onComplete: function() { part.destroy(); }
      });
    }

    // Combo display
    if (this.comboCount >= 2) {
      this.comboText.setText('x' + this.comboCount + ' COMBO!');
      this.comboText.setAlpha(1);
      this.tweens.killTweensOf(this.comboText);
      this.tweens.add({
        targets: this.comboText,
        alpha: 0,
        duration: 1500,
        delay: 500
      });
    }

    // Score bonus
    this.totalScore += 50 * this.comboCount;

    // Camera punch
    this.cameras.main.shake(100, 0.008);

    // Check phase transition
    this._updatePhase();

    // Check boss death
    if (this.bossHP <= 0) {
      this._defeatBoss();
    }
  },

  // === COLLISION HANDLERS ===

  _hitProjectile: function(hero, proj) {
    if (!proj.active) return;
    proj.setActive(false).setVisible(false);
    proj.body.enable = false;
    this._wasHitThisAttack = true;
    this.comboCount = 0;
    this._takeDamage();
  },

  _hitBossBody: function(hero, bossHitbox) {
    this._wasHitThisAttack = true;
    this.comboCount = 0;
    this._takeDamage();
  },

  _takeDamage: function() {
    if (this.isInvincible || this.gameOver) return;

    if (this.hasShield) {
      this.hasShield = false;
      this.isInvincible = true;
      this.shieldBubble.setVisible(false);
      TangledTower.AudioGen.playHit();
      var self = this;
      this.tweens.add({
        targets: this.hero,
        alpha: { from: 0.5, to: 1 },
        duration: 100,
        repeat: 4,
        yoyo: true,
        onComplete: function() {
          self.isInvincible = false;
          self.hero.alpha = 1;
        }
      });
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
      if (!self.gameOver) {
        if (TangledTower.InputManager.isCrouching) {
          self.hero.play('hero-crouch', true);
        } else {
          self.hero.play('hero-run', true);
        }
      }
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

    // Boss defeat animation — dramatic explosion
    var self = this;
    var w = TangledTower.GAME_WIDTH;
    var h = TangledTower.GAME_HEIGHT;

    // Boss flashes rapidly
    var flashCount = 0;
    var flashTimer = this.time.addEvent({
      delay: 100,
      repeat: 9,
      callback: function() {
        flashCount++;
        self.boss.setTint(flashCount % 2 === 0 ? 0xFFFFFF : 0xFF0000);
      }
    });

    // After flashing, explode
    this.time.delayedCall(1000, function() {
      // Explosion particles
      for (var i = 0; i < 25; i++) {
        var color = Phaser.Utils.Array.GetRandom([0xFFDD00, 0xFF6600, 0xFF0000, 0xFFFF00]);
        var part = self.add.circle(
          self.boss.x + Phaser.Math.Between(-20, 20),
          self.boss.y + Phaser.Math.Between(-30, 10),
          Phaser.Math.Between(2, 5), color
        );
        self.tweens.add({
          targets: part,
          x: part.x + Phaser.Math.Between(-60, 60),
          y: part.y + Phaser.Math.Between(-60, 20),
          alpha: 0,
          scale: 0,
          duration: Phaser.Math.Between(400, 800),
          delay: i * 30,
          onComplete: function() { part.destroy(); }
        });
      }

      // Boss shrinks and disappears
      var currentScale = self.boss.scaleX;
      self.tweens.add({
        targets: self.boss,
        alpha: 0,
        scaleX: currentScale * 0.1,
        scaleY: currentScale * 0.1,
        duration: 600,
        ease: 'Quad.easeIn'
      });

      self.cameras.main.flash(300, 255, 255, 200);
      self.cameras.main.shake(300, 0.03);
    });

    // Score bonus
    this.totalScore += 1000;

    // "BOSS DEFEATED!" text
    this.time.delayedCall(1600, function() {
      var defeatText = TangledTower.bmpText(self, w / 2, h / 2 - 20, 'BOSS DEFEATED!', 16, 0xFFD700, 60);
      self.tweens.add({
        targets: [defeatText, defeatText._shadow],
        scale: { from: 0.5, to: 1.2 },
        duration: 500,
        yoyo: true
      });

      var bonusText = TangledTower.bmpText(self, w / 2, h / 2 + 5, '+1000 POINTS', 8, 0xFFFFFF, 60);
    });

    // Transition
    this.time.delayedCall(3500, function() {
      self.cameras.main.fadeOut(500);
      self.time.delayedCall(500, function() {
        self.scene.stop('UIScene');

        if (self.levelIndex >= TangledTower.LEVELS.length - 1) {
          self.scene.start('VictoryScene', {
            score: self.totalScore,
            lives: self.health
          });
        } else {
          self.scene.start('CutsceneScene', {
            level: self.levelIndex + 1,
            score: self.totalScore,
            lives: self.health
          });
        }
      });
    });
  },

  // Callbacks for InputManager — crouch visual squish
  onCrouchStart: function() {
    if (this.hero) {
      var scale = this.hero.scaleX || TangledTower.HERO_SCALE;
      this.hero.setScale(scale, scale * 0.7);
      this.hero.setTint(0xDDDDCC);
    }
  },

  onCrouchEnd: function() {
    if (this.hero) {
      var scale = this.hero.scaleX || TangledTower.HERO_SCALE;
      this.hero.setScale(scale);
      this.hero.clearTint();
    }
  },

  shutdown: function() {
    TangledTower.InputManager.destroy();
  }
});
