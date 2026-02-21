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
  _groundPressQueued: false, // Intent window: press on ground awaiting disambiguation
  COYOTE_TIME: 120,        // ms — can still jump briefly after leaving ground
  JUMP_BUFFER: 200,        // ms — press remembered just before landing
  TAP_INTENT_WINDOW: 50,   // ms — wait this long to disambiguate tap vs hold (3 frames)

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

    if (canGroundJump && this.jumpCount === 0 && !this.isCrouching) {
      // Queue ground press — wait TAP_INTENT_WINDOW to disambiguate tap vs hold
      this._groundPressQueued = true;
    } else if (!onGround && this.jumpCount === 1) {
      // In air after first jump -> double jump immediately (no need to wait)
      hero.body.velocity.y = TangledTower.DOUBLE_JUMP_VELOCITY;
      this.jumpCount = 2;
      this.hasJumpedThisPress = true;
      hero.play('hero-jump', true);
      if (TangledTower.AudioGen) TangledTower.AudioGen.playDoubleJump();
    } else if (!onGround && this.jumpCount === 0) {
      // Falling (not from a jump) and can't coyote-jump — buffer press for landing
      this._pendingJump = true;
      this._pendingJumpTime = now;
    }
  },

  _fireJump: function() {
    var scene = this._scene;
    if (!scene.hero || !scene.hero.body) return;
    var hero = scene.hero;
    this._groundPressQueued = false;
    hero.body.velocity.y = TangledTower.JUMP_VELOCITY;
    this.jumpCount = 1;
    this.hasJumpedThisPress = true;
    hero.play('hero-jump', true);
    if (TangledTower.AudioGen) TangledTower.AudioGen.playJump();
  },

  _onUp: function() {
    var scene = this._scene;
    if (!scene.hero || !scene.hero.body) return;

    var hero = scene.hero;
    var onGround = hero.body.blocked.down;

    this.isDown = false;
    this._pendingJump = false;

    if (this._groundPressQueued) {
      // Released before intent window expired — this was a tap. Fire jump now.
      this._fireJump();
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
        var holdDuration = scene.time.now - this.downTime;
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
      } else {
        hero.play('hero-run', true);
      }
      if (scene.onCrouchEnd) scene.onCrouchEnd();

    } else if (!this.hasJumpedThisPress) {
      // Released after intent window but before crouch threshold — slow tap, fire jump
      if (onGround && this.jumpCount === 0) {
        this._fireJump();
      }
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

    // Intent window: if ground press is queued and window expired while still held,
    // this is a hold — enter crouch path (don't jump)
    if (this._groundPressQueued && this.isDown) {
      var queuedTime = now - this.downTime;
      if (queuedTime >= this.TAP_INTENT_WINDOW) {
        // Still held past intent window — this is a hold, not a tap
        this._groundPressQueued = false;
        // Don't jump; fall through to crouch detection below
      }
    }

    // Reset jump count when landing
    if (onGround && hero.body.velocity.y >= 0 && this.jumpCount > 0) {
      this.jumpCount = 0;

      if (!this.isCrouching) {
        hero.play('hero-run', true);

        // Input buffer: if press happened just before landing, fire jump now
        if (this._pendingJump && (now - this._pendingJumpTime) < this.JUMP_BUFFER) {
          this._pendingJump = false;
          this._fireJump();
        }
      }
    }

    // Crouch detection: holding on ground past threshold (and intent window has passed)
    if (this.isDown && onGround && !this.isCrouching && !this.hasJumpedThisPress && !this._groundPressQueued) {
      var holdTime = now - this.downTime;
      if (holdTime >= TangledTower.CROUCH_THRESHOLD) {
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
