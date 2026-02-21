// Tangled Tower - Input Manager
// Single-button control: tap=jump, double-tap=double-jump, hold=crouch, release-crouch=charged-jump
var TangledTower = TangledTower || {};

TangledTower.InputManager = {
  // State tracking
  isDown: false,
  downTime: 0,
  jumpCount: 0,        // 0=grounded, 1=jumped, 2=double-jumped
  isCrouching: false,
  hasJumpedThisPress: false,  // Prevents re-jumping on same press
  enabled: true,
  _scene: null,

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

    var hero = scene.hero;
    var onGround = hero.body.blocked.down;

    if (!onGround && this.jumpCount === 1) {
      // In air after first jump -> double jump immediately
      hero.body.velocity.y = TangledTower.DOUBLE_JUMP_VELOCITY;
      this.jumpCount = 2;
      this.hasJumpedThisPress = true;
      hero.play('hero-jump', true);
      if (TangledTower.AudioGen) TangledTower.AudioGen.playDoubleJump();
    }
    // If on ground, we wait to see if it's a tap or hold (handled in update)
  },

  _onUp: function() {
    var scene = this._scene;
    if (!scene.hero || !scene.hero.body) return;

    var now = scene.time.now;
    var holdDuration = now - this.downTime;
    var hero = scene.hero;
    var onGround = hero.body.blocked.down;

    this.isDown = false;

    if (this.isCrouching) {
      // Release crouch -> charged jump
      this.isCrouching = false;

      // Restore full hitbox
      hero.body.setSize(12, 16);
      hero.body.setOffset(2, 0);

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
      } else {
        hero.play('hero-run', true);
      }
      if (scene.onCrouchEnd) scene.onCrouchEnd();

    } else if (!this.hasJumpedThisPress && holdDuration < TangledTower.CROUCH_THRESHOLD) {
      // Quick tap release -> normal jump (if on ground and haven't jumped)
      if (onGround && this.jumpCount === 0) {
        hero.body.velocity.y = TangledTower.JUMP_VELOCITY;
        this.jumpCount = 1;
        this.hasJumpedThisPress = true;
        hero.play('hero-jump', true);
        if (TangledTower.AudioGen) TangledTower.AudioGen.playJump();
      }
    }
  },

  update: function(scene) {
    if (!scene.hero || !scene.hero.body) return;

    var hero = scene.hero;
    var onGround = hero.body.blocked.down;

    // Reset jump count when landing
    if (onGround && hero.body.velocity.y >= 0 && this.jumpCount > 0) {
      this.jumpCount = 0;
      if (!this.isCrouching) {
        hero.play('hero-run', true);
      }
    }

    // Check for crouch: holding input while on ground past threshold
    if (this.isDown && onGround && !this.isCrouching && !this.hasJumpedThisPress) {
      var holdTime = scene.time.now - this.downTime;
      if (holdTime >= TangledTower.CROUCH_THRESHOLD) {
        this.isCrouching = true;
        hero.play('hero-crouch', true);
        // Shorter hitbox
        hero.body.setSize(14, 10);
        hero.body.setOffset(1, 6);
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
  }
};
