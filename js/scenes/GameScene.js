// Tangled Tower - Main Game Scene (Auto-Runner)
var TangledTower = TangledTower || {};

TangledTower.GameScene = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function GameScene() {
    Phaser.Scene.call(this, { key: 'GameScene' });
  },

  init: function(data) {
    this.levelIndex = data.level || 0;
    this.totalScore = data.score || 0;
    this.lives = data.lives || TangledTower.STARTING_LIVES;
  },

  create: function() {
    var w = TangledTower.GAME_WIDTH;
    var h = TangledTower.GAME_HEIGHT;
    var levelData = TangledTower.LEVELS[this.levelIndex];

    this.levelData = levelData;
    this.scrollSpeed = levelData.scrollSpeed;
    this.distanceTraveled = 0;
    this.score = 0;
    this.health = this.lives;
    this.isInvincible = false;
    this.hasShield = false;
    this.hasBoots = false;
    this.hasSword = false;
    this.gameOver = false;
    this.levelComplete = false;
    this.lastSpawnDistance = {};
    this.eventsFired = {};
    this.totalCoins = 0;

    // Camera
    this.cameras.main.setBackgroundColor(levelData.skyColor);
    this.cameras.main.fadeIn(300);

    // Stars overlay for night levels
    if (levelData.id >= 4 && this.textures.exists('stars')) {
      this.add.image(w / 2, 50, 'stars').setScrollFactor(0);
    }

    // Parallax backgrounds
    this._createBackgrounds(levelData);

    // Decorative scenery
    this._createScenery(levelData);

    // Ground
    this._createGround();

    // Object pools
    this.vines = this.physics.add.group({ allowGravity: false, maxSize: 12 });
    this.goblins = this.physics.add.group({ allowGravity: false, maxSize: 8 });
    this.bats = this.physics.add.group({ allowGravity: false, maxSize: 8 });
    this.coins = this.physics.add.group({ allowGravity: false, maxSize: 25 });
    this.powerups = this.physics.add.group({ allowGravity: false, maxSize: 5 });

    // Hero
    this._createHero();

    // Collision
    this.physics.add.collider(this.hero, this.groundGroup);
    this.physics.add.overlap(this.hero, this.vines, this._hitObstacle, null, this);
    this.physics.add.overlap(this.hero, this.goblins, this._hitEnemy, null, this);
    this.physics.add.overlap(this.hero, this.bats, this._hitEnemy, null, this);
    this.physics.add.overlap(this.hero, this.coins, this._collectCoin, null, this);
    this.physics.add.overlap(this.hero, this.powerups, this._collectPowerup, null, this);

    // Shield visual (follows hero)
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

    // Sword orbit visual — check both procedural and AI keys
    this.swordOrbit = null;
    if (this.textures.exists('powerup_sword')) {
      this.swordOrbit = this.add.sprite(0, 0, 'powerup_sword').setVisible(false).setScale(TangledTower.POWERUP_SCALE * 0.8).setDepth(11);
    } else if (this.textures.exists('sword-powerup')) {
      this.swordOrbit = this.add.sprite(0, 0, 'sword-powerup', 0).setVisible(false).setScale(0.8).setDepth(11);
    }
    this.swordAngle = 0;

    // Input
    TangledTower.InputManager.setup(this);

    // HUD scene
    this.scene.launch('UIScene', {
      health: this.health,
      score: this.totalScore + this.score,
      level: levelData.id,
      levelName: levelData.name
    });

    // Music
    TangledTower.AudioGen.startMusic(levelData.musicIndex);

    // Hint text container
    this.hintText = null;
  },

  update: function(time, delta) {
    if (this.gameOver || this.levelComplete) return;

    // Safety: prevent hero from falling through ground
    if (this.hero && this.hero.y > TangledTower.GROUND_Y + 30) {
      this.hero.y = TangledTower.GROUND_Y - 10;
      this.hero.body.velocity.y = 0;
    }

    var dt = delta / 1000;

    // Gradually increase speed
    if (this.scrollSpeed < this.levelData.maxScrollSpeed) {
      this.scrollSpeed += dt * 2;
    }

    var effectiveSpeed = this.scrollSpeed * (this.hasBoots ? TangledTower.SPEED_BOOST_MULT : 1);

    // Update distance
    this.distanceTraveled += effectiveSpeed * dt;

    // Score from distance
    this.score = Math.floor(this.distanceTraveled / 10);

    // Scroll backgrounds
    this._scrollBackgrounds(effectiveSpeed, dt);

    // Scroll ground
    this._scrollGround(effectiveSpeed, dt);

    // Scroll scenery
    this._scrollScenery(effectiveSpeed, dt);

    // Scroll all objects
    this._scrollObjects(this.vines, effectiveSpeed, dt);
    this._scrollObjects(this.goblins, effectiveSpeed, dt);
    this._scrollObjects(this.bats, effectiveSpeed, dt);
    this._scrollObjects(this.coins, effectiveSpeed, dt);
    this._scrollObjects(this.powerups, effectiveSpeed, dt);

    // Animate bats (sine wave)
    this.bats.getChildren().forEach(function(bat) {
      if (bat.active) {
        bat._floatTime = (bat._floatTime || 0) + dt;
        bat.y = bat._baseY + Math.sin(bat._floatTime * 3) * 15;
      }
    });

    // Spawn objects
    this._checkSpawns();

    // Check level events
    this._checkEvents();

    // Landing dust detection
    var onGround = this.hero.body.blocked.down;
    if (onGround && !this._wasOnGround) {
      // Just landed — dust puff
      this._spawnParticles(this.hero.x - 4, TangledTower.GROUND_Y, 0xBBAA88, 3);
      this._spawnParticles(this.hero.x + 4, TangledTower.GROUND_Y, 0xBBAA88, 3);
    }
    this._wasOnGround = onGround;

    // Running dust (periodic small puffs)
    if (onGround && !TangledTower.InputManager.isCrouching) {
      this._runDustTimer = (this._runDustTimer || 0) + dt;
      if (this._runDustTimer > 0.25) {
        this._runDustTimer = 0;
        var dustP = this.add.circle(this.hero.x - 8, TangledTower.GROUND_Y - 1, 1.5, 0xBBAA88, 0.6);
        this.tweens.add({
          targets: dustP,
          x: dustP.x - 12,
          alpha: 0,
          scale: 0,
          duration: 350,
          onComplete: function() { dustP.destroy(); }
        });
      }
    }

    // Input update
    TangledTower.InputManager.update(this);

    // Shield visual follows hero
    if (this.hasShield && this.shieldBubble) {
      this.shieldBubble.setPosition(this.hero.x, this.hero.y);
      this.shieldBubble.setVisible(true);
    }

    // Sword orbit visual
    if (this.hasSword && this.swordOrbit) {
      this.swordAngle += dt * 4;
      this.swordOrbit.setPosition(
        this.hero.x + Math.cos(this.swordAngle) * 14,
        this.hero.y + Math.sin(this.swordAngle) * 14
      );
      this.swordOrbit.setVisible(true);
    }

    // Update HUD
    this.events.emit('updateHUD', {
      health: this.health,
      score: this.totalScore + this.score,
      level: this.levelData.id
    });

    // Check level complete
    if (this.distanceTraveled >= this.levelData.levelLength) {
      this._levelComplete();
    }
  },

  // --- Background ---

  _createBackgrounds: function(levelData) {
    var w = TangledTower.GAME_WIDTH;
    var h = TangledTower.GAME_HEIGHT;

    // Simple colored rectangles as parallax layers
    // Far layer - mountains/hills
    if (this.textures.exists('bg-far')) {
      this.bgFar = this.add.tileSprite(0, 0, w, h, 'bg-far')
        .setOrigin(0, 0)
        .setTint(levelData.bgTints.far);
    } else {
      this.bgFar = null;
    }

    // Mid layer - distant trees
    if (this.textures.exists('bg-mid')) {
      this.bgMid = this.add.tileSprite(0, 0, w, h, 'bg-mid')
        .setOrigin(0, 0)
        .setTint(levelData.bgTints.mid);
    } else {
      this.bgMid = null;
    }

    // Near layer - close trees
    if (this.textures.exists('bg-near')) {
      this.bgNear = this.add.tileSprite(0, 0, w, h, 'bg-near')
        .setOrigin(0, 0)
        .setTint(levelData.bgTints.near);
    } else {
      this.bgNear = null;
    }
  },

  _scrollBackgrounds: function(speed, dt) {
    var px = speed * dt;
    if (this.bgFar) this.bgFar.tilePositionX += px * 0.15;
    if (this.bgMid) this.bgMid.tilePositionX += px * 0.4;
    if (this.bgNear) this.bgNear.tilePositionX += px * 0.7;
  },

  // --- Ground ---

  _createGround: function() {
    var w = TangledTower.GAME_WIDTH;
    var h = TangledTower.GAME_HEIGHT;

    // Single static physics body spanning full width
    this.groundGroup = this.physics.add.staticGroup();
    var groundBody = this.groundGroup.create(w / 2, TangledTower.GROUND_Y + 16, null);
    groundBody.setDisplaySize(w + 40, 32).setVisible(false).refreshBody();

    // Visual ground - use TileSprite for smooth scrolling
    var groundTexKey = this.textures.exists('ground-tile') ? 'ground-tile' : 'ground';
    if (this.textures.exists(groundTexKey)) {
      this.groundTileSprite = this.add.tileSprite(
        0, TangledTower.GROUND_Y, w, h - TangledTower.GROUND_Y, groundTexKey
      ).setOrigin(0, 0).setTint(this.levelData.groundTint);
    } else {
      // Fallback: simple colored rectangles
      var gfx = this.add.graphics();
      gfx.fillStyle(0x55CC55, 1);
      gfx.fillRect(0, TangledTower.GROUND_Y, w, 4);
      gfx.fillStyle(0x885522, 1);
      gfx.fillRect(0, TangledTower.GROUND_Y + 4, w, h - TangledTower.GROUND_Y - 4);
      this.groundTileSprite = null;
    }
  },

  _scrollGround: function(speed, dt) {
    if (this.groundTileSprite) {
      this.groundTileSprite.tilePositionX += speed * dt;
    }
  },

  // --- Decorative Scenery ---

  _createScenery: function(levelData) {
    var w = TangledTower.GAME_WIDTH;
    this.sceneryItems = [];
    this._sceneryTimer = 0;
    this._ambientTimer = 0;
    this.ambientItems = [];

    // Place initial scenery across the screen
    var hasTree = this.textures.exists('bg_tree');
    var hasBush = this.textures.exists('bg_bush');
    var hasRock = this.textures.exists('bg_rock');

    if (hasTree || hasBush || hasRock) {
      for (var i = 0; i < 5; i++) {
        var x = Phaser.Math.Between(0, w);
        this._addSceneryAt(x);
      }
    }

    // Add initial ambient creatures
    var isNight = levelData.id >= 4;
    var hasButterfly = this.textures.exists('butterfly');
    var hasFirefly = this.textures.exists('firefly');
    if ((isNight && hasFirefly) || (!isNight && hasButterfly)) {
      for (var j = 0; j < 3; j++) {
        this._addAmbientCreature(Phaser.Math.Between(40, w - 40));
      }
    }
  },

  _addSceneryAt: function(x) {
    var groundY = TangledTower.GROUND_Y;
    var types = [];
    if (this.textures.exists('bg_tree')) types.push('bg_tree');
    if (this.textures.exists('bg_bush')) types.push('bg_bush');
    if (this.textures.exists('bg_rock')) types.push('bg_rock');
    if (types.length === 0) return;

    var type = Phaser.Utils.Array.GetRandom(types);
    var scales = { bg_tree: 0.32, bg_bush: 0.31, bg_rock: 0.31 };
    var depthMult = Phaser.Math.FloatBetween(0.7, 1.3);
    var scale = (scales[type] || 0.31) * Phaser.Math.FloatBetween(0.8, 1.2) * depthMult;

    var item = this.add.sprite(x, groundY, type).setOrigin(0.5, 1).setScale(scale);
    item.setDepth(type === 'bg_tree' ? 1 : 2);
    item.setAlpha(type === 'bg_tree' ? 0.7 : 0.8);
    var baseSpeeds = { bg_tree: 0.8, bg_bush: 0.95, bg_rock: 0.95 };
    item._scrollSpeed = (baseSpeeds[type] || 0.8) * depthMult;
    this.sceneryItems.push(item);
  },

  _addAmbientCreature: function(x) {
    var isNight = this.levelData.id >= 4;
    var key = isNight ? 'firefly' : 'butterfly';
    if (!this.textures.exists(key)) return;

    var y = Phaser.Math.Between(40, TangledTower.GROUND_Y - 40);
    var scale = isNight ? 0.31 : 0.30;
    var creature = this.add.sprite(x, y, key).setScale(scale).setDepth(3);

    // Gentle floating motion
    this.tweens.add({
      targets: creature,
      y: y + Phaser.Math.Between(-15, 15),
      x: x + Phaser.Math.Between(-20, 20),
      duration: Phaser.Math.Between(2000, 4000),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Fireflies glow
    if (isNight) {
      this.tweens.add({
        targets: creature,
        alpha: { from: 0.4, to: 1 },
        duration: Phaser.Math.Between(500, 1500),
        yoyo: true,
        repeat: -1
      });
    }

    creature._scrollSpeed = 0.6;
    this.ambientItems.push(creature);
  },

  _scrollScenery: function(speed, dt) {
    var px = speed * dt;
    var w = TangledTower.GAME_WIDTH;

    // Scroll and recycle scenery
    for (var i = this.sceneryItems.length - 1; i >= 0; i--) {
      var item = this.sceneryItems[i];
      item.x -= px * item._scrollSpeed;
      if (item.x < -60) {
        item.destroy();
        this.sceneryItems.splice(i, 1);
      }
    }

    // Scroll ambient creatures
    for (var j = this.ambientItems.length - 1; j >= 0; j--) {
      var amb = this.ambientItems[j];
      amb.x -= px * amb._scrollSpeed;
      if (amb.x < -40) {
        amb.destroy();
        this.ambientItems.splice(j, 1);
      }
    }

    // Spawn new scenery
    this._sceneryTimer += dt;
    if (this._sceneryTimer > 0.8) {
      this._sceneryTimer = 0;
      if (Math.random() < 0.75) {
        this._addSceneryAt(w + 40);
      }
    }

    // Spawn new ambient creatures
    this._ambientTimer += dt;
    if (this._ambientTimer > 2.5) {
      this._ambientTimer = 0;
      if (Math.random() < 0.5) {
        this._addAmbientCreature(w + 30);
      }
    }
  },

  // --- Hero ---

  _createHero: function() {
    var heroKey = this.textures.exists('hero_run1') ? 'hero_run1' :
                  (this.textures.exists('hero_run') ? 'hero_run' : 'hero');
    var scale = TangledTower.HERO_SCALE || 0.32;
    this.hero = this.physics.add.sprite(TangledTower.HERO_X, TangledTower.GROUND_Y - 20, heroKey);
    this.hero.setScale(scale);
    this.hero.body.setGravityY(TangledTower.GRAVITY);
    // Hitbox sized for the scaled sprite
    var heroW = this.hero.displayWidth * 0.5;
    var heroH = this.hero.displayHeight * 0.85;
    this.hero.body.setSize(heroW / scale, heroH / scale);
    this.hero.body.setOffset(
      (this.hero.width - heroW / scale) / 2,
      this.hero.height - heroH / scale
    );
    this.hero.setDepth(10);

    this.hero.play('hero-run');
  },

  // --- Spawning ---

  _checkSpawns: function() {
    var spawns = this.levelData.spawns;

    for (var i = 0; i < spawns.length; i++) {
      var s = spawns[i];
      if (this.distanceTraveled < s.startAfter) continue;

      var lastDist = this.lastSpawnDistance[s.type] || s.startAfter;
      var jitter = s.freq * 0.3;
      var nextDist = lastDist + s.freq + Phaser.Math.Between(-jitter, jitter);

      if (this.distanceTraveled >= nextDist) {
        this._spawnObject(s.type);
        this.lastSpawnDistance[s.type] = this.distanceTraveled;
      }
    }
  },

  _spawnObject: function(type) {
    var x = TangledTower.SPAWN_X;
    var groundY = TangledTower.GROUND_Y;

    switch (type) {
      case 'coin':
        this._spawnCoin(x, groundY - Phaser.Math.Between(20, 50));
        break;

      case 'coin_arc':
        this._spawnCoinArc(x);
        break;

      case 'vine_small':
        this._spawnVine(x, 0);
        break;

      case 'vine_medium':
        this._spawnVine(x, 1);
        break;

      case 'vine_tall':
        this._spawnVine(x, 2);
        break;

      case 'goblin':
        this._spawnGoblin(x);
        break;

      case 'bat':
        this._spawnBat(x);
        break;

      case 'shield':
        this._spawnPowerup(x, groundY - 35, 'shield');
        break;

      case 'boots':
        this._spawnPowerup(x, groundY - 35, 'boots');
        break;

      case 'sword':
        this._spawnPowerup(x, groundY - 35, 'sword');
        break;
    }
  },

  _spawnCoin: function(x, y) {
    var hasProcCoin = this.textures.exists('coin-proc');
    var coinKey = hasProcCoin ? 'coin-proc' : 'coin';
    var isAI = !hasProcCoin && this.textures.exists('coin');
    var coin = this.coins.get(x, y, coinKey, isAI ? undefined : 0);
    if (coin) {
      coin.setActive(true).setVisible(true);
      coin.body.enable = true;
      if (isAI) {
        var coinScale = 0.31;
        coin.setScale(coinScale);
        var coinSize = coin.displayWidth * 2.0;
        coin.body.setSize(coinSize / coinScale, coinSize / coinScale);
        coin.body.setOffset(
          (coin.width - coinSize / coinScale) / 2,
          (coin.height - coinSize / coinScale) / 2
        );
      } else {
        coin.body.setSize(10, 10);
      }
      try { coin.play('coin-spin'); } catch (e) {}
    }
  },

  _spawnCoinArc: function(startX) {
    var groundY = TangledTower.GROUND_Y;
    var points = [
      { x: 0, y: -20 },
      { x: 22, y: -35 },
      { x: 44, y: -42 },
      { x: 66, y: -35 },
      { x: 88, y: -20 }
    ];
    for (var i = 0; i < points.length; i++) {
      this._spawnCoin(startX + points[i].x, groundY + points[i].y);
    }
  },

  _spawnVine: function(x, size) {
    var vineKey = this.textures.exists('vine') ? 'vine' : null;
    var groundY = TangledTower.GROUND_Y;
    var isAI = this.textures.exists('vine') && !this.textures.get('vine').source[0].isRenderTexture;
    var scale = TangledTower.VINE_SCALE || 0.30;
    var heights = [16, 24, 32];
    var h = heights[size] || 16;

    var vine = this.vines.get(x, groundY - h / 2, vineKey, isAI ? undefined : Math.min(size, 2));
    if (vine) {
      vine.setActive(true).setVisible(true);
      vine.setDepth(5);
      vine.body.enable = true;
      if (isAI) {
        // Scale AI vine differently per size
        var sizeScales = [scale * 1.2, scale * 1.5, scale * 1.8];
        vine.setScale(sizeScales[size] || scale);
        var vineW = vine.displayWidth * 0.4;
        var vineH = vine.displayHeight * 0.85;
        vine.body.setSize(vineW / vine.scaleX, vineH / vine.scaleY);
        vine.body.setOffset(
          (vine.width - vineW / vine.scaleX) / 2,
          vine.height - vineH / vine.scaleY
        );
        vine.y = groundY - vine.displayHeight / 2;
      } else {
        vine.body.setSize(6, h);
      }
    }
  },

  _spawnGoblin: function(x) {
    var gobKey = this.textures.exists('goblin') ? 'goblin' : null;
    var scale = TangledTower.ENEMY_SCALE || 0.32;
    var isAI = gobKey && !this.textures.get('goblin').source[0].isRenderTexture;
    var goblin = this.goblins.get(x, TangledTower.GROUND_Y - 6, gobKey, isAI ? undefined : 0);
    if (goblin) {
      goblin.setActive(true).setVisible(true);
      goblin.body.enable = true;
      goblin._alive = true;
      if (isAI) {
        goblin.setScale(scale);
        var gobW = goblin.displayWidth * 0.5;
        var gobH = goblin.displayHeight * 0.85;
        goblin.body.setSize(gobW / scale, gobH / scale);
        goblin.body.setOffset(
          (goblin.width - gobW / scale) / 2,
          goblin.height - gobH / scale
        );
        goblin.y = TangledTower.GROUND_Y - goblin.displayHeight / 2;
      } else {
        goblin.body.setSize(10, 12);
      }
      if (gobKey) goblin.play('goblin-walk');
    }
  },

  _spawnBat: function(x) {
    var batKey = this.textures.exists('bat') ? 'bat' : null;
    var scale = TangledTower.ENEMY_SCALE || 0.32;
    var isAI = batKey && !this.textures.get('bat').source[0].isRenderTexture;
    // Bats fly at a height that requires crouching (head height)
    var y = TangledTower.GROUND_Y - 24;
    var bat = this.bats.get(x, y, batKey, isAI ? undefined : 0);
    if (bat) {
      bat.setActive(true).setVisible(true);
      bat.body.enable = true;
      bat._baseY = y;
      bat._floatTime = 0;
      bat._alive = true;
      if (isAI) {
        bat.setScale(scale);
        var batW = bat.displayWidth * 0.6;
        var batH = bat.displayHeight * 0.5;
        bat.body.setSize(batW / scale, batH / scale);
        bat.body.setOffset(
          (bat.width - batW / scale) / 2,
          (bat.height - batH / scale) / 2
        );
      } else {
        bat.body.setSize(14, 8);
      }
      if (batKey) bat.play('bat-fly');
    }
  },

  _spawnPowerup: function(x, y, type) {
    // Check for AI sprites first, fall back to procedural
    var aiKeys = {
      shield: 'powerup_shield',
      boots: 'powerup_boots',
      sword: 'powerup_sword'
    };
    var procKeys = {
      shield: 'shield-powerup',
      boots: 'speed-boots',
      sword: 'sword-powerup'
    };
    var spriteKey = null;
    var isAI = false;
    if (this.textures.exists(aiKeys[type])) {
      spriteKey = aiKeys[type];
      isAI = true;
    } else if (this.textures.exists(procKeys[type])) {
      spriteKey = procKeys[type];
    }
    var scale = TangledTower.POWERUP_SCALE || 0.31;
    var pu = this.powerups.get(x, y, spriteKey, isAI ? undefined : 0);
    if (pu) {
      pu.setActive(true).setVisible(true);
      pu.body.enable = true;
      pu._puType = type;
      if (isAI) {
        pu.setScale(scale);
        var puSize = pu.displayWidth * 2.0;
        pu.body.setSize(puSize / scale, puSize / scale);
        pu.body.setOffset(
          (pu.width - puSize / scale) / 2,
          (pu.height - puSize / scale) / 2
        );
      } else {
        pu.body.setSize(10, 10);
        if (type === 'shield' && spriteKey) pu.play('shield-glow');
        if (type === 'sword' && spriteKey) pu.play('sword-shine');
      }

      // Float animation
      this.tweens.add({
        targets: pu,
        y: y - 5,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  },

  // --- Scroll Objects ---

  _scrollObjects: function(group, speed, dt) {
    var px = speed * dt;
    group.getChildren().forEach(function(obj) {
      if (obj.active) {
        obj.x -= px;
        if (obj.x < -60) {
          obj.setActive(false).setVisible(false);
          obj.body.enable = false;
        }
      }
    });
  },

  // --- Collision Handlers ---

  _hitObstacle: function(hero, obstacle) {
    if (!obstacle.active) return;
    this._takeDamage();
  },

  _hitEnemy: function(hero, enemy) {
    if (!enemy.active || !enemy._alive) return;

    // Check if stomping (falling onto enemy from above)
    if (hero.body.velocity.y > 0 && hero.body.bottom < enemy.body.center.y + 4) {
      // Stomp!
      enemy._alive = false;
      if (enemy.play) {
        try { enemy.play('goblin-die'); } catch (e) {}
      }
      enemy.body.enable = false;
      var enemyBaseScale = enemy.scaleY;
      this.tweens.add({
        targets: enemy,
        alpha: 0,
        scaleY: enemyBaseScale * 0.15,
        duration: 200,
        onComplete: function() {
          enemy.setActive(false).setVisible(false);
          enemy.alpha = 1;
          enemy.scaleY = enemyBaseScale;
        }
      });
      hero.body.velocity.y = -200; // Bounce
      TangledTower.InputManager.jumpCount = 1;
      TangledTower.InputManager.hasJumpedThisPress = true;
      this.score += 100;
      TangledTower.AudioGen.playEnemyDefeat();

      // Stomp particles
      this._spawnParticles(enemy.x, enemy.y, 0xFFDD00, 4);

      // Floating "+100" text
      var stompPopup = this.add.bitmapText(enemy.x, enemy.y, 'pixel-font-gold', '+100', 8)
        .setOrigin(0.5).setDepth(20);
      this.tweens.add({
        targets: stompPopup,
        y: enemy.y - 30,
        alpha: 0,
        duration: 700,
        onComplete: function() { stompPopup.destroy(); }
      });

      // Brief slow-motion for impact
      this.time.timeScale = 0.3;
      var self2 = this;
      this.time.delayedCall(80, function() { self2.time.timeScale = 1; });
    } else {
      this._takeDamage();
    }
  },

  _takeDamage: function() {
    if (this.isInvincible || this.gameOver) return;

    if (this.hasSword) {
      // Sword absorbs hit + brief invincibility
      this.hasSword = false;
      this.isInvincible = true;
      if (this.swordOrbit) this.swordOrbit.setVisible(false);
      TangledTower.AudioGen.playSword();
      var swordPopup = this.add.bitmapText(this.hero.x, this.hero.y - 20, 'pixel-font', 'BLOCKED!', 8)
        .setOrigin(0.5).setDepth(20).setTint(0xCCCCDD);
      this.tweens.add({
        targets: swordPopup,
        y: this.hero.y - 50,
        alpha: 0,
        duration: 700,
        onComplete: function() { swordPopup.destroy(); }
      });
      this._spawnParticles(this.hero.x, this.hero.y, 0xCCCCDD, 6);
      this.cameras.main.flash(100, 200, 200, 220, true);
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

    if (this.hasShield) {
      // Shield absorbs hit + brief invincibility
      this.hasShield = false;
      this.isInvincible = true;
      this.shieldBubble.setVisible(false);
      TangledTower.AudioGen.playHit();
      var shieldPopup = this.add.bitmapText(this.hero.x, this.hero.y - 20, 'pixel-font', 'SHIELD!', 8)
        .setOrigin(0.5).setDepth(20).setTint(0x44DDFF);
      this.tweens.add({
        targets: shieldPopup,
        y: this.hero.y - 50,
        alpha: 0,
        duration: 700,
        onComplete: function() { shieldPopup.destroy(); }
      });
      this._spawnParticles(this.hero.x, this.hero.y, 0x44DDFF, 6);
      this.cameras.main.flash(100, 68, 221, 255, true);
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
    this.events.emit('updateHUD', {
      health: this.health,
      score: this.totalScore + this.score,
      level: this.levelData.id
    });
    TangledTower.AudioGen.playHit();

    if (this.health <= 0) {
      this._die();
      return;
    }

    // Invincibility frames
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

    // Brief hurt animation
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

    // Screen shake
    this.cameras.main.shake(150, 0.01);
  },

  _collectCoin: function(hero, coin) {
    if (!coin.active) return;
    coin.setActive(false).setVisible(false);
    coin.body.enable = false;
    this.score += 10;
    this.totalCoins++;
    TangledTower.AudioGen.playCoin();

    // Particle burst
    this._spawnParticles(coin.x, coin.y, 0xFFDD00, 5);

    // Floating "+10" text
    var popup = this.add.bitmapText(coin.x, coin.y, 'pixel-font-gold', '+10', 8)
      .setOrigin(0.5).setDepth(20);
    this.tweens.add({
      targets: popup,
      y: coin.y - 25,
      alpha: 0,
      duration: 600,
      onComplete: function() { popup.destroy(); }
    });

    // Every 100 coins, award a heart
    if (this.totalCoins % 100 === 0 && this.health < TangledTower.STARTING_LIVES) {
      this.health++;
      this.events.emit('updateHUD', { health: this.health, score: this.totalScore + this.score, level: this.levelData.id });
      TangledTower.AudioGen.playPowerUp();
      this._spawnParticles(this.hero.x, this.hero.y - 10, 0xFF3344, 8);
      var heartPopup = this.add.bitmapText(this.hero.x, this.hero.y - 20, 'pixel-font', '+1 HEART', 8)
        .setOrigin(0.5).setDepth(20).setTint(0xFF3344);
      var self = this;
      this.tweens.add({
        targets: heartPopup,
        y: this.hero.y - 50,
        alpha: 0,
        duration: 1000,
        onComplete: function() { heartPopup.destroy(); }
      });
    }
  },

  _collectPowerup: function(hero, pu) {
    if (!pu.active) return;
    var type = pu._puType;
    pu.setActive(false).setVisible(false);
    pu.body.enable = false;
    this.tweens.killTweensOf(pu);

    TangledTower.AudioGen.playPowerUp();
    this._spawnParticles(pu.x, pu.y, 0x44DDFF, 8);

    // Powerup name popup
    var names = { shield: 'SHIELD!', boots: 'SPEED!', sword: 'SWORD!' };
    var popup = this.add.bitmapText(pu.x, pu.y, 'pixel-font', names[type] || '', 8)
      .setOrigin(0.5).setDepth(20).setTint(0x44DDFF);
    this.tweens.add({
      targets: popup,
      y: pu.y - 25,
      alpha: 0,
      duration: 800,
      onComplete: function() { popup.destroy(); }
    });

    switch (type) {
      case 'shield':
        this.hasShield = true;
        TangledTower.AudioGen.playShield();
        break;

      case 'boots':
        this.hasBoots = true;
        var self = this;
        this.time.delayedCall(TangledTower.SPEED_BOOST_DURATION, function() {
          self.hasBoots = false;
        });
        break;

      case 'sword':
        this.hasSword = true;
        break;
    }
  },

  // --- Particles ---

  _spawnParticles: function(x, y, color, count) {
    for (var i = 0; i < count; i++) {
      var p = this.add.circle(x, y, 2, color, 1);
      this.tweens.add({
        targets: p,
        x: x + Phaser.Math.Between(-20, 20),
        y: y + Phaser.Math.Between(-25, 5),
        alpha: 0,
        scale: 0,
        duration: 300,
        onComplete: function() { p.destroy(); }
      });
    }
  },

  // --- Events ---

  _checkEvents: function() {
    var events = this.levelData.events;
    for (var i = 0; i < events.length; i++) {
      var ev = events[i];
      if (this.distanceTraveled >= ev.at && !this.eventsFired[i]) {
        this.eventsFired[i] = true;
        if (ev.type === 'hint') {
          this._showHint(ev.text);
        }
      }
    }
  },

  _showHint: function(text) {
    var w = TangledTower.GAME_WIDTH;
    if (this.hintText) {
      if (this.hintText._shadow) this.hintText._shadow.destroy();
      this.hintText.destroy();
    }
    this.hintText = TangledTower.bmpText(this, w / 2, 80, text, 16, 0xFFFFFF, 20);

    var shadow = this.hintText._shadow;
    this.tweens.add({
      targets: [this.hintText, shadow],
      alpha: 0,
      y: '-=20',
      duration: 2500,
      delay: 1500,
      onComplete: function() {
        if (this.hintText) {
          if (this.hintText._shadow) this.hintText._shadow.destroy();
          this.hintText.destroy();
        }
      }.bind(this)
    });
  },

  // --- Death ---

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
      ease: 'Quad.easeIn',
      onComplete: function() {
        self.cameras.main.fadeOut(500, 0, 0, 0);
        self.time.delayedCall(1000, function() {
          self.scene.stop('UIScene');
          self.scene.start('GameOverScene', {
            level: self.levelIndex,
            score: self.totalScore + self.score
          });
        });
      }
    });
  },

  // --- Level Complete ---

  _levelComplete: function() {
    if (this.levelComplete) return;
    this.levelComplete = true;
    TangledTower.InputManager.enabled = false;
    TangledTower.AudioGen.stopMusic();
    TangledTower.AudioGen.playLevelComplete();

    var self = this;
    var finalScore = this.totalScore + this.score + 1000; // Level bonus

    // Brief celebration
    this._spawnParticles(this.hero.x, this.hero.y - 10, 0xFFD700, 10);
    this._spawnParticles(this.hero.x, this.hero.y - 10, 0xFF3344, 8);

    this.time.delayedCall(1500, function() {
      self.cameras.main.fadeOut(500, 0, 0, 0);
      self.time.delayedCall(500, function() {
        self.scene.stop('UIScene');
        // Transition to boss
        self.scene.start('BossScene', {
          level: self.levelIndex,
          score: finalScore,
          lives: self.health
        });
      });
    });
  },

  // Callbacks for InputManager
  onCrouchStart: function() {
    if (this.hero) {
      var scale = this.hero.scaleX || TangledTower.HERO_SCALE;
      this.hero.setScale(scale, scale * 0.7);  // squish to 70% height
      this.hero.setTint(0xDDDDCC);
      this._spawnParticles(this.hero.x - 6, TangledTower.GROUND_Y, 0xBBAA88, 3);
      this._spawnParticles(this.hero.x + 6, TangledTower.GROUND_Y, 0xBBAA88, 3);
    }
  },

  onCrouchEnd: function() {
    if (this.hero) {
      var scale = this.hero.scaleX || TangledTower.HERO_SCALE;
      this.hero.setScale(scale);  // restore uniform scale
      this.hero.clearTint();
      this._spawnParticles(this.hero.x - 5, TangledTower.GROUND_Y, 0xDDCC99, 4);
      this._spawnParticles(this.hero.x + 5, TangledTower.GROUND_Y, 0xDDCC99, 4);
    }
  },

  shutdown: function() {
    TangledTower.InputManager.destroy();
  }
});
