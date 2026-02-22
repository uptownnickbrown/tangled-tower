// Tangled Tower - Input Manager
// Single-button control: tap=jump, double-tap=double-jump, hold=crouch, release-crouch=charged-jump
var TangledTower = TangledTower || {};

TangledTower.InputManager = {
  // State tracking
  isDown: false,
  downTime: 0,
  jumpCount: 0,        // 0=grounded, 1=jumped, 2=double-jumped
  isCrouching: false,
  hasJumpedThisPress: false,
  enabled: true,
  _scene: null,

  // Platformer feel tuning
  _lastGroundedTime: 0,    // For coyote time
  _pendingJump: false,     // For input buffering
  _pendingJumpTime: 0,
  _groundPressQueued: false, // Ground press queued — stays alive until release (jump) or crouch
  COYOTE_TIME: 120,        // ms — can still jump briefly after leaving ground
  JUMP_BUFFER: 200,        // ms — press remembered just before landing

  // Debug logging (temporary)
  _debugLog: [],
  _debugEnabled: true,
  _log: function(event, detail) {
    if (!this._debugEnabled) return;
    var scene = this._scene;
    var now = scene ? scene.time.now : 0;
    var hero = scene ? scene.hero : null;
    var entry = {
      t: Math.round(now),
      evt: event,
      detail: detail || '',
      state: {
        isDown: this.isDown,
        jumpCount: this.jumpCount,
        isCrouching: this.isCrouching,
        hasJumped: this.hasJumpedThisPress,
        queued: this._groundPressQueued,
        pendingJump: this._pendingJump,
        onGround: hero && hero.body ? hero.body.blocked.down : '?',
        velY: hero && hero.body ? Math.round(hero.body.velocity.y) : '?',
        heroY: hero ? Math.round(hero.y * 10) / 10 : '?'
      }
    };
    this._debugLog.push(entry);
    console.log('[INPUT ' + event + '] t=' + entry.t + ' ' + (detail || '') + ' | ' + JSON.stringify(entry.state));
    // Keep only last 50 entries
    if (this._debugLog.length > 50) this._debugLog.shift();
  },

  dumpLog: function() {
    console.log('=== INPUT DEBUG LOG (' + this._debugLog.length + ' entries) ===');
    console.log(JSON.stringify(this._debugLog, null, 2));
  },

  setup: function(scene) {
    var self = this;
    this._scene = scene;
    this.reset();

    // Keyboard - space bar
    scene.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    scene.spaceKey.on('down', function() { if (self.enabled) self._onDown(); });
    scene.spaceKey.on('up', function() { if (self.enabled) self._onUp(); });

    // Touch / Mouse
    scene.input.on('pointerdown', function() { if (self.enabled) self._onDown(); });
    scene.input.on('pointerup', function() { if (self.enabled) self._onUp(); });

    // Prevent spacebar scrolling
    scene.input.keyboard.addCapture('SPACE');
  },

  _onDown: function() {
    var scene = this._scene;
    if (!scene.hero || !scene.hero.body) return;

    this.isDown = true;
    this.downTime = scene.time.now;
    this.hasJumpedThisPress = false;
    this._pendingJump = false;
    this._groundPressQueued = false;

    var hero = scene.hero;
    var onGround = hero.body.blocked.down;
    var now = scene.time.now;

    // Coyote time: allow ground jump if hero left ground very recently
    var canGroundJump = onGround ||
      (now - this._lastGroundedTime < this.COYOTE_TIME && this.jumpCount === 0);

    this._log('DOWN', 'onGround=' + onGround + ' canGroundJump=' + canGroundJump + ' coyoteDelta=' + (now - this._lastGroundedTime));

    if (canGroundJump && !this.isCrouching) {
      // Queue ground press — stays alive until consumed by release (jump) or crouch
      this._groundPressQueued = true;
      this._log('DOWN:queued', 'ground press queued');
    } else if (!onGround && this.jumpCount === 1) {
      // In air after first jump -> double jump immediately (no need to wait)
      hero.body.velocity.y = TangledTower.DOUBLE_JUMP_VELOCITY;
      this.jumpCount = 2;
      this.hasJumpedThisPress = true;
      hero.play('hero-jump', true);
      if (TangledTower.AudioGen) TangledTower.AudioGen.playDoubleJump();
      this._log('DOWN:doubleJump', 'fired double jump');
    } else if (!onGround && this.jumpCount === 0) {
      // Falling (not from a jump) and can't coyote-jump — buffer press for landing
      this._pendingJump = true;
      this._pendingJumpTime = now;
      this._log('DOWN:buffered', 'buffered for landing');
    } else {
      this._log('DOWN:noop', 'no branch taken');
    }
  },

  _fireJump: function(source) {
    var scene = this._scene;
    if (!scene.hero || !scene.hero.body) return;
    var hero = scene.hero;
    this._groundPressQueued = false;
    hero.body.velocity.y = TangledTower.JUMP_VELOCITY;
    this.jumpCount = 1;
    this.hasJumpedThisPress = true;
    hero.play('hero-jump', true);
    if (TangledTower.AudioGen) TangledTower.AudioGen.playJump();
    this._log('JUMP', 'fired from ' + (source || 'unknown'));
  },

  _onUp: function() {
    var scene = this._scene;
    if (!scene.hero || !scene.hero.body) return;

    var hero = scene.hero;
    var onGround = hero.body.blocked.down;
    var holdDuration = scene.time.now - this.downTime;

    this.isDown = false;
    this._pendingJump = false;

    this._log('UP', 'holdMs=' + Math.round(holdDuration) + ' onGround=' + onGround);

    if (this._groundPressQueued) {
      // Released before crouch threshold — this is a jump.
      this._log('UP:queuedJump', 'queue was alive, firing jump');
      this._fireJump('onUp-queued');
      return;
    }

    if (this.isCrouching) {
      // Release crouch -> charged jump
      this.isCrouching = false;

      // Restore full hitbox (scaled for AI sprites)
      var scale = hero.scaleX || 1;
      var heroW = hero.displayWidth * 0.5;
      var heroH = hero.displayHeight * 0.85;
      hero.body.setSize(heroW / scale, heroH / scale);
      hero.body.setOffset(
        (hero.width - heroW / scale) / 2,
        hero.height - heroH / scale
      );

      if (onGround) {
        var chargeRatio = Math.min((holdDuration - TangledTower.CROUCH_THRESHOLD) / 800, 1);
        var velocity = Phaser.Math.Linear(
          TangledTower.JUMP_VELOCITY,
          TangledTower.CHARGED_JUMP_VELOCITY,
          chargeRatio
        );
        hero.body.velocity.y = velocity;
        this.jumpCount = 1;
        hero.play('hero-jump', true);
        if (TangledTower.AudioGen) TangledTower.AudioGen.playJump();
        this._log('UP:chargedJump', 'charge=' + Math.round(chargeRatio * 100) + '%');
      } else {
        hero.play('hero-run', true);
        this._log('UP:crouchRelease', 'airborne, no jump');
      }
      if (scene.onCrouchEnd) scene.onCrouchEnd();

    } else if (!this.hasJumpedThisPress) {
      // Fallback: released without jumping and not crouching
      if (onGround && this.jumpCount === 0) {
        this._log('UP:fallbackJump', 'fallback path fired jump');
        this._fireJump('onUp-fallback');
      } else {
        this._log('UP:noJump', 'FAILED - onGround=' + onGround + ' jumpCount=' + this.jumpCount);
      }
    } else {
      this._log('UP:alreadyJumped', 'hasJumpedThisPress was true');
    }
  },

  update: function(scene) {
    if (!scene.hero || !scene.hero.body) return;

    var hero = scene.hero;
    var onGround = hero.body.blocked.down;
    var now = scene.time.now;

    // Track last grounded time for coyote time
    if (onGround) {
      this._lastGroundedTime = now;
    }

    // Reset jump count when landing
    if (onGround && hero.body.velocity.y >= 0 && this.jumpCount > 0) {
      this._log('LAND', 'jumpCount ' + this.jumpCount + ' -> 0');
      this.jumpCount = 0;

      if (!this.isCrouching) {
        hero.play('hero-run', true);

        // Input buffer: if press happened just before landing, fire jump now
        if (this._pendingJump && (now - this._pendingJumpTime) < this.JUMP_BUFFER) {
          this._pendingJump = false;
          this._log('LAND:buffer', 'buffered jump fired on landing');
          this._fireJump('landing-buffer');
        }
      }
    }

    // Crouch detection: holding on ground past crouch threshold
    // The _groundPressQueued flag stays alive until consumed by _onUp (jump) or here (crouch).
    if (this.isDown && onGround && !this.isCrouching && !this.hasJumpedThisPress) {
      var holdTime = now - this.downTime;
      if (holdTime >= TangledTower.CROUCH_THRESHOLD) {
        this._log('CROUCH', 'activated at holdTime=' + Math.round(holdTime) + ' queued was ' + this._groundPressQueued);
        this._groundPressQueued = false; // consumed by crouch path
        this.isCrouching = true;
        hero.play('hero-crouch', true);
        // Shorter hitbox (scaled for AI sprites)
        var crouchScale = hero.scaleX || 1;
        var crouchW = hero.displayWidth * 0.6;
        var crouchH = hero.displayHeight * 0.35;
        hero.body.setSize(crouchW / crouchScale, crouchH / crouchScale);
        hero.body.setOffset(
          (hero.width - crouchW / crouchScale) / 2,
          hero.height - crouchH / crouchScale
        );
        if (TangledTower.AudioGen) TangledTower.AudioGen.playCrouch();
        if (scene.onCrouchStart) scene.onCrouchStart();
      }
    }
  },

  reset: function() {
    this.isDown = false;
    this.downTime = 0;
    this.jumpCount = 0;
    this.isCrouching = false;
    this.hasJumpedThisPress = false;
    this.enabled = true;
    this._lastGroundedTime = 0;
    this._pendingJump = false;
    this._pendingJumpTime = 0;
    this._groundPressQueued = false;
  },

  destroy: function() {
    if (this._scene) {
      if (this._scene.spaceKey) {
        this._scene.spaceKey.removeAllListeners();
      }
      this._scene.input.removeAllListeners();
    }
    this.reset();
    this._scene = null;
  }
};
