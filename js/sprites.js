// Tangled Tower - Sprite Generation System
// Draws all pixel art procedurally using canvas operations
var TangledTower = TangledTower || {};

TangledTower.SpriteGen = {

  // Helper: create a canvas texture and get its context
  _makeCanvas: function(scene, key, w, h) {
    // Skip if an AI sprite with this key was already loaded in preload
    if (scene.textures.exists(key)) return null;
    var tex = scene.textures.createCanvas(key, w, h);
    var ctx = tex.getContext();
    ctx.imageSmoothingEnabled = false;
    return { tex: tex, ctx: ctx };
  },

  // Helper: draw a single pixel
  _px: function(ctx, x, y, color) {
    if (color === null || color === undefined) return;
    var r = (color >> 16) & 0xFF;
    var g = (color >> 8) & 0xFF;
    var b = color & 0xFF;
    ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
    ctx.fillRect(x, y, 1, 1);
  },

  // Helper: draw a filled rectangle
  _rect: function(ctx, x, y, w, h, color) {
    var r = (color >> 16) & 0xFF;
    var g = (color >> 8) & 0xFF;
    var b = color & 0xFF;
    ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
    ctx.fillRect(x, y, w, h);
  },

  // Helper: draw from a compact string map
  // Each char maps to a color, '.' is transparent
  _drawMap: function(ctx, ox, oy, map, palette) {
    for (var y = 0; y < map.length; y++) {
      var row = map[y];
      for (var x = 0; x < row.length; x++) {
        var ch = row[x];
        if (ch !== '.' && palette[ch] !== undefined) {
          this._px(ctx, ox + x, oy + y, palette[ch]);
        }
      }
    }
  },

  // Register frames on a texture
  _addFrames: function(tex, frameW, frameH, count) {
    for (var i = 0; i < count; i++) {
      tex.add(i, 0, i * frameW, 0, frameW, frameH);
    }
  },

  // =========================================
  // MAIN ENTRY: Generate all textures
  // =========================================
  createAllTextures: function(scene) {
    this._createHero(scene);
    this._createGoblin(scene);
    this._createBat(scene);
    this._createVine(scene);
    this._createCoin(scene);
    this._createShieldPowerup(scene);
    this._createSpeedBoots(scene);
    this._createSwordPowerup(scene);
    this._createHeart(scene);
    this._createHeartEmpty(scene);
    this._createGround(scene);
    this._createFireball(scene);
    this._createWarning(scene);
    this._createBossTroll(scene);
    this._createBossVine(scene);
    this._createBossBat(scene);
    this._createBossKnight(scene);
    this._createBossDragon(scene);
    this._createTower(scene);
    this._createBackgrounds(scene);
    this._createStars(scene);
    this._createCloud(scene);
  },

  // =========================================
  // HERO KNIGHT - 16x16, 7 frames
  // =========================================
  _createHero: function(scene) {
    var fw = 16, fh = 16, frames = 7;
    var c = this._makeCanvas(scene, 'hero', fw * frames, fh);
    if (!c) return;
    var ctx = c.ctx;
    var P = TangledTower.PALETTE;

    // Color map for compact drawing
    var pal = {
      'H': P.HELMET_GRAY, 'h': P.HELMET_DARK, 'L': P.HELMET_LIGHT,
      'S': P.SKIN, 'e': P.EYE_BLACK, 'E': P.EYE_WHITE,
      'B': P.ARMOR_BLUE, 'b': P.ARMOR_DARK, 'T': P.BELT_BROWN,
      'R': P.CAPE_RED, 'r': P.CAPE_DARK,
      'W': P.BOOT_BROWN, 'w': P.BOOT_DARK
    };

    // Frame 0: Run 1 (right leg forward)
    this._drawMap(ctx, 0, 0, [
      '......HH........',  // Note: only 16 chars per row used
      '.....HHLHH......',
      '.....HhHhH......',
      '......SSSS......',
      '......SeES......',
      '...R.BBBBB......',
      '..RR.BBbBB......',
      '..Rr.BBTBB......',
      '...r.BBBBB......',
      '......BBB.......',
      '......B.B.......',
      '......W.W.......',
      '.....W..w.......',
      '.....w...W......',
      '..........w.....',
      '................'
    ].map(function(r) { return r.substring(0, 16); }), pal);

    // Frame 1: Run 2 (legs together)
    this._drawMap(ctx, fw, 0, [
      '......HH........',
      '.....HHLHH......',
      '.....HhHhH......',
      '......SSSS......',
      '......SeES......',
      '..RR.BBBBB......',
      '..Rr.BBbBB......',
      '...r.BBTBB......',
      '......BBBBB.....',
      '......BBB.......',
      '......B.B.......',
      '......W.W.......',
      '......W.W.......',
      '......w.w.......',
      '................',
      '................'
    ].map(function(r) { return r.substring(0, 16); }), pal);

    // Frame 2: Run 3 (left leg forward)
    this._drawMap(ctx, fw * 2, 0, [
      '......HH........',
      '.....HHLHH......',
      '.....HhHhH......',
      '......SSSS......',
      '......SeES......',
      '....RBBBBB......',
      '...RRBBbBB......',
      '...Rr.BBTBB.....',
      '......BBBBB.....',
      '......BBB.......',
      '......B.B.......',
      '......W.W.......',
      '......w..W......',
      '.....W...w......',
      '................',
      '................'
    ].map(function(r) { return r.substring(0, 16); }), pal);

    // Frame 3: Run 4 (legs crossing)
    this._drawMap(ctx, fw * 3, 0, [
      '......HH........',
      '.....HHLHH......',
      '.....HhHhH......',
      '......SSSS......',
      '......SeES......',
      '...RRBBBBB......',
      '..RRRBBbBB......',
      '...rr.BBTBB.....',
      '......BBBBB.....',
      '......BBB.......',
      '......BB........',
      '.....WW.........',
      '......WW........',
      '.....ww.........',
      '................',
      '................'
    ].map(function(r) { return r.substring(0, 16); }), pal);

    // Frame 4: Jump (legs tucked)
    this._drawMap(ctx, fw * 4, 0, [
      '......HH........',
      '.....HHLHH......',
      '.....HhHhH......',
      '......SSSS......',
      '......SeES......',
      '..RRRBBBBB......',
      '..RRRBBbBB......',
      '...rrBBTBB......',
      '......BBBBB.....',
      '......BWBWB.....',
      '......WwWw......',
      '................',
      '................',
      '................',
      '................',
      '................'
    ].map(function(r) { return r.substring(0, 16); }), pal);

    // Frame 5: Crouch (compressed, bottom-aligned)
    this._drawMap(ctx, fw * 5, 0, [
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '....HHLHH.......',
      '....HhHhH.......',
      '...RSSESS.......',
      '..RRBBbBB.......',
      '..rrBBTBB.......',
      '....BBBBB.......',
      '....BWBWB.......',
      '....WwWw........',
      '................',
      '................'
    ].map(function(r) { return r.substring(0, 16); }), pal);

    // Frame 6: Hurt (leaning back)
    this._drawMap(ctx, fw * 6, 0, [
      '........HH......',
      '.......HHLHH....',
      '.......HhHhH....',
      '........SSSS....',
      '........SeES....',
      '...RR..BBBBB....',
      '..RRR..BBbBB....',
      '...rr..BBTBB....',
      '........BBBBB...',
      '........BBB.....',
      '.......B..B.....',
      '.......W..W.....',
      '......W...W.....',
      '......w...w.....',
      '................',
      '................'
    ].map(function(r) { return r.substring(0, 16); }), pal);

    c.tex.refresh();
    this._addFrames(c.tex, fw, fh, frames);
  },

  // =========================================
  // GOBLIN - 12x12, 4 frames
  // =========================================
  _createGoblin: function(scene) {
    var fw = 12, fh = 12, frames = 4;
    var c = this._makeCanvas(scene, 'goblin', fw * frames, fh);
    if (!c) return;
    var ctx = c.ctx;
    var P = TangledTower.PALETTE;

    var pal = {
      'G': P.GOBLIN_GREEN, 'g': P.GOBLIN_DARK, 'E': P.GOBLIN_EYES,
      'B': P.BLACK, 'W': P.BOOT_DARK
    };

    // Walk 1
    this._drawMap(ctx, 0, 0, [
      '....GGG.....',
      '...GgGgG....',
      '...GEGEG....',
      '...GGGGG....',
      '....GBG.....',
      '...GGGGG....',
      '..gGGGGg....',
      '...GGGGG....',
      '....GGG.....',
      '....G.G.....',
      '...W..W.....',
      '...W..W.....'
    ], pal);

    // Walk 2
    this._drawMap(ctx, fw, 0, [
      '....GGG.....',
      '...GgGgG....',
      '...GEGEG....',
      '...GGGGG....',
      '....GBG.....',
      '...GGGGG....',
      '..gGGGGg....',
      '...GGGGG....',
      '....GGG.....',
      '....G.G.....',
      '....W.W.....',
      '...W...W....'
    ], pal);

    // Stomp (squished slightly)
    this._drawMap(ctx, fw * 2, 0, [
      '............',
      '............',
      '...GGGGG....',
      '..GgGgGgG...',
      '..GGEGEGG...',
      '..GGGGGGG...',
      '...GGGGG....',
      '.gGGGGGGg...',
      '..GGGGGGG...',
      '...GGGGG....',
      '..WW..WW....',
      '............'
    ], pal);

    // Die (flattened)
    this._drawMap(ctx, fw * 3, 0, [
      '............',
      '............',
      '............',
      '............',
      '............',
      '............',
      '............',
      '............',
      '.GgGgGgGgG..',
      '.GEGEGEGEG..',
      '.GGGGGGGG...',
      '............'
    ], pal);

    c.tex.refresh();
    this._addFrames(c.tex, fw, fh, frames);
  },

  // =========================================
  // BAT - 16x10, 4 frames
  // =========================================
  _createBat: function(scene) {
    var fw = 16, fh = 10, frames = 4;
    var c = this._makeCanvas(scene, 'bat', fw * frames, fh);
    if (!c) return;
    var ctx = c.ctx;
    var P = TangledTower.PALETTE;

    var pal = {
      'P': P.BAT_PURPLE, 'p': P.BAT_DARK, 'W': P.BAT_WING, 'E': P.BAT_EYES
    };

    // Fly 1 (wings up)
    this._drawMap(ctx, 0, 0, [
      '.W..........W...',
      '.WW........WW...',
      '.WWW..PP..WWW...',
      '..WWWPPPPWWW....',
      '...WPPEEPP W....',
      '....PPPPPP......',
      '....pPPPPp......',
      '.....pPPp.......',
      '......pp........',
      '................'
    ], pal);

    // Fly 2 (wings down)
    this._drawMap(ctx, fw, 0, [
      '................',
      '................',
      '......PP........',
      '....PPPPPP......',
      '...PPPEEPPP.....',
      '..WWPPPPPPWW....',
      '.WWW.pPPp.WWW...',
      '.WW...pp...WW...',
      '.W..........W...',
      '................'
    ], pal);

    // Swoop (diving)
    this._drawMap(ctx, fw * 2, 0, [
      '................',
      '.....PPP........',
      '....PPPPP.......',
      '...PPPEEP.......',
      '..WPPPPPPW......',
      '.WWpPPPPpWW.....',
      '....pppp........',
      '................',
      '................',
      '................'
    ], pal);

    // Die
    this._drawMap(ctx, fw * 3, 0, [
      '................',
      '................',
      '................',
      '....W....W......',
      '...WPPPPW.......',
      '...PPEEPP.......',
      '...WpppPW.......',
      '....WWWW........',
      '................',
      '................'
    ], pal);

    c.tex.refresh();
    this._addFrames(c.tex, fw, fh, frames);
  },

  // =========================================
  // THORNY VINE - 8x16, 3 frames (growth stages)
  // =========================================
  _createVine: function(scene) {
    var fw = 8, fh = 16, frames = 3;
    var c = this._makeCanvas(scene, 'vine', fw * frames, fh);
    if (!c) return;
    var ctx = c.ctx;
    var P = TangledTower.PALETTE;

    var pal = {
      'V': P.VINE_GREEN, 'v': P.VINE_DARK, 'L': P.VINE_LIGHT, 'T': P.THORN_RED
    };

    // Small vine
    this._drawMap(ctx, 0, 0, [
      '........',
      '........',
      '........',
      '........',
      '........',
      '........',
      '........',
      '........',
      '........',
      '........',
      '...VL...',
      '..TVVv..',
      '..VVVv..',
      '..VvVT..',
      '.vVVVv..',
      '.vVVVv..'
    ], pal);

    // Medium vine
    this._drawMap(ctx, fw, 0, [
      '........',
      '........',
      '........',
      '........',
      '........',
      '...LV...',
      '..TVVv..',
      '..VVLv..',
      '..VvVT..',
      '.TVVVv..',
      '.VVLVv..',
      '.VVVVv..',
      '.VvVVT..',
      '.vVVVv..',
      '.vVVVv..',
      '.vVVVv..'
    ], pal);

    // Full grown vine
    this._drawMap(ctx, fw * 2, 0, [
      '...LT...',
      '..TVLv..',
      '..VVVv..',
      '.TVVLv..',
      '.VVVVv..',
      '.VvVVT..',
      '.VVLVv..',
      'TVVVVv..',
      '.VVLVv..',
      '.VvVVT..',
      '.VVVVv..',
      '.VVLVv..',
      '.VvVVT..',
      '.vVVVv..',
      '.vVVVv..',
      '.vVVVv..'
    ], pal);

    c.tex.refresh();
    this._addFrames(c.tex, fw, fh, frames);
  },

  // =========================================
  // COIN - 8x8, 4 frames (spinning)
  // =========================================
  _createCoin: function(scene) {
    var fw = 8, fh = 8, frames = 4;
    var c = this._makeCanvas(scene, 'coin', fw * frames, fh);
    if (!c) return;
    var ctx = c.ctx;
    var P = TangledTower.PALETTE;

    var pal = {
      'G': P.COIN_GOLD, 'S': P.COIN_SHINE, 'D': P.COIN_DARK
    };

    // Full face
    this._drawMap(ctx, 0, 0, [
      '..GGGG..',
      '.GSGGGG.',
      'GSGGGGG.',
      'GGGGGGGG',
      'GGGGGDGG',
      'GGGGDDG.',
      '.GGGGDG.',
      '..GGGG..'
    ], pal);

    // 3/4 turn
    this._drawMap(ctx, fw, 0, [
      '...GGG..',
      '..SGGG..',
      '.GSGGG..',
      '.GGGGG..',
      '.GGGGD..',
      '.GGGDG..',
      '..GGDG..',
      '...GGG..'
    ], pal);

    // Edge
    this._drawMap(ctx, fw * 2, 0, [
      '....GG..',
      '...SGG..',
      '...GGG..',
      '...GGG..',
      '...GGG..',
      '...GDG..',
      '...GDG..',
      '....GG..'
    ], pal);

    // 3/4 other way
    this._drawMap(ctx, fw * 3, 0, [
      '...GGG..',
      '..GGSG..',
      '..GGGSG.',
      '..GGGGG.',
      '..DGGGG.',
      '..GDGGG.',
      '..GDGG..',
      '...GGG..'
    ], pal);

    c.tex.refresh();
    this._addFrames(c.tex, fw, fh, frames);
  },

  // =========================================
  // SHIELD POWERUP - 10x10, 2 frames
  // =========================================
  _createShieldPowerup: function(scene) {
    var fw = 10, fh = 10, frames = 2;
    var c = this._makeCanvas(scene, 'shield-powerup', fw * frames, fh);
    if (!c) return;
    var ctx = c.ctx;
    var P = TangledTower.PALETTE;

    var pal = {
      'C': P.SHIELD_CYAN, 'L': P.SHIELD_LIGHT, 'D': P.SHIELD_DARK
    };

    // Glow 1
    this._drawMap(ctx, 0, 0, [
      '...CCCC...',
      '..CLLLC...',
      '.CLLLLCC..',
      'CLLCCCCC..',
      'CLCCCCDC..',
      'CCCCCDC...',
      '.CCCDCC...',
      '..CCDC....',
      '...CC.....',
      '..........'
    ], pal);

    // Glow 2 (slightly different highlight)
    this._drawMap(ctx, fw, 0, [
      '...CCCC...',
      '..CCCLC...',
      '.CCCLLLC..',
      'CCCCLLCC..',
      'CCCCCLCC..',
      'CDCCCCC...',
      '.DCCCCC...',
      '..DCCC....',
      '...CC.....',
      '..........'
    ], pal);

    c.tex.refresh();
    this._addFrames(c.tex, fw, fh, frames);
  },

  // =========================================
  // SPEED BOOTS - 10x10, 1 frame
  // =========================================
  _createSpeedBoots: function(scene) {
    var fw = 10, fh = 10;
    var c = this._makeCanvas(scene, 'speed-boots', fw, fh);
    if (!c) return;
    var ctx = c.ctx;
    var P = TangledTower.PALETTE;

    var pal = {
      'O': P.BOOT_ORANGE, 'L': P.BOOT_LIGHT, 'W': P.WHITE, 'D': P.BOOT_DARK
    };

    this._drawMap(ctx, 0, 0, [
      '..W.......',
      '.WW...W...',
      '..W..WW...',
      '.....OOO..',
      '...OOOOO..',
      '..OOLOOD..',
      '..OOOOOO..',
      '.OOOOOOOD.',
      '.OOOOOODD.',
      '.DDDDDDD..'
    ], pal);

    c.tex.refresh();
    this._addFrames(c.tex, fw, fh, 1);
  },

  // =========================================
  // SWORD POWERUP - 10x12, 2 frames
  // =========================================
  _createSwordPowerup: function(scene) {
    var fw = 10, fh = 12, frames = 2;
    var c = this._makeCanvas(scene, 'sword-powerup', fw * frames, fh);
    if (!c) return;
    var ctx = c.ctx;
    var P = TangledTower.PALETTE;

    var pal = {
      'S': P.SWORD_SILVER, 'L': P.SWORD_LIGHT, 'D': P.SWORD_DARK, 'H': P.SWORD_HILT
    };

    // Shine 1
    this._drawMap(ctx, 0, 0, [
      '....L.....',
      '....SL....',
      '....SS....',
      '....SS....',
      '....SS....',
      '....SS....',
      '....SD....',
      '...HSSD...',
      '..HHHHD...',
      '...HHH....',
      '....H.....',
      '..........'
    ], pal);

    // Shine 2 (glint moved)
    this._drawMap(ctx, fw, 0, [
      '....S.....',
      '....SS....',
      '....SL....',
      '....SS....',
      '....SL....',
      '....SS....',
      '....SD....',
      '...HSSD...',
      '..HHHHD...',
      '...HHH....',
      '....H.....',
      '..........'
    ], pal);

    c.tex.refresh();
    this._addFrames(c.tex, fw, fh, frames);
  },

  // =========================================
  // HEART - 8x8, 1 frame
  // =========================================
  _createHeart: function(scene) {
    var c = this._makeCanvas(scene, 'heart', 8, 8);
    if (!c) return;
    var ctx = c.ctx;
    var P = TangledTower.PALETTE;

    var pal = { 'R': P.HEART_RED, 'D': P.HEART_DARK, 'S': P.HEART_SHINE };

    this._drawMap(ctx, 0, 0, [
      '.SR..SR.',
      'SRRRRRRR',
      'RRRRRRRR',
      'RRRRRRDP',
      '.RRRRRR.',
      '..RRRR..',
      '...RD...',
      '........'
    ].map(function(r) { return r.replace(/P/g, 'D'); }), pal);

    c.tex.refresh();
    this._addFrames(c.tex, 8, 8, 1);
  },

  // =========================================
  // HEART EMPTY - 8x8, 1 frame
  // =========================================
  _createHeartEmpty: function(scene) {
    var c = this._makeCanvas(scene, 'heart-empty', 8, 8);
    var ctx = c.ctx;

    var pal = { 'D': 0x444444, 'L': 0x333333 };

    this._drawMap(ctx, 0, 0, [
      '.DL..DL.',
      'DLLLLLLZ',
      'LLLLLLLL',
      'LLLLLLLD',
      '.LLLLLL.',
      '..LLLL..',
      '...LD...',
      '........'
    ].map(function(r) { return r.replace(/Z/g, 'L'); }), pal);

    c.tex.refresh();
    this._addFrames(c.tex, 8, 8, 1);
  },

  // =========================================
  // GROUND TILES - 16x16, 3 frames
  // =========================================
  _createGround: function(scene) {
    var fw = 16, fh = 16, frames = 3;
    var c = this._makeCanvas(scene, 'ground', fw * frames, fh);
    var ctx = c.ctx;
    var P = TangledTower.PALETTE;

    // Frame 0: Grass tile (green top, checkered dirt below)
    // Green grass top
    this._rect(ctx, 0, 0, fw, 2, P.GRASS_TOP);
    this._rect(ctx, 0, 2, fw, 2, P.GRASS_DARK);

    // Checkered brick pattern below
    for (var y = 4; y < fh; y += 4) {
      for (var x = 0; x < fw; x += 8) {
        var offset = ((y / 4) % 2 === 0) ? 0 : 4;
        this._rect(ctx, x + offset, y, 7, 3, P.DIRT_BROWN);
        this._rect(ctx, x + offset, y + 3, 7, 1, P.DIRT_DARK);
        this._rect(ctx, x + offset + 7, y, 1, 4, P.DIRT_DARK);
      }
    }
    // Fill gaps
    this._rect(ctx, 0, 4, fw, fh - 4, P.DIRT_CHECK);
    // Redraw bricks on top of fill
    for (var y2 = 4; y2 < fh; y2 += 4) {
      for (var x2 = 0; x2 < fw + 8; x2 += 8) {
        var off2 = ((y2 / 4) % 2 === 0) ? 0 : 4;
        var bx = x2 + off2;
        if (bx < fw && bx >= -7) {
          var drawX = Math.max(0, bx);
          var drawW = Math.min(7, fw - drawX);
          this._rect(ctx, drawX, y2, drawW, 3, P.DIRT_BROWN);
          this._rect(ctx, drawX, y2 + 3, drawW, 1, P.DIRT_DARK);
        }
      }
    }

    // Frame 1: Dirt tile
    this._rect(ctx, fw, 0, fw, fh, P.DIRT_BROWN);
    for (var y3 = 0; y3 < fh; y3 += 4) {
      for (var x3 = 0; x3 < fw; x3 += 8) {
        var off3 = ((y3 / 4) % 2 === 0) ? 0 : 4;
        var bx3 = x3 + off3;
        if (bx3 >= 0 && bx3 + 7 <= fw) {
          this._rect(ctx, fw + bx3, y3 + 3, 7, 1, P.DIRT_DARK);
          this._rect(ctx, fw + bx3 + 7, y3, 1, 4, P.DIRT_DARK);
        }
      }
    }

    // Frame 2: Stone tile
    this._rect(ctx, fw * 2, 0, fw, fh, P.STONE_GRAY);
    for (var y4 = 0; y4 < fh; y4 += 4) {
      for (var x4 = 0; x4 < fw; x4 += 8) {
        var off4 = ((y4 / 4) % 2 === 0) ? 0 : 4;
        var bx4 = x4 + off4;
        this._rect(ctx, fw * 2 + bx4, y4, 1, 4, P.STONE_DARK);
        this._rect(ctx, fw * 2 + bx4 + 1, y4 + 3, 6, 1, P.STONE_DARK);
        // Highlight
        this._px(ctx, fw * 2 + bx4 + 1, y4, P.STONE_LIGHT);
      }
    }

    c.tex.refresh();
    this._addFrames(c.tex, fw, fh, frames);

    // Also create a single-tile ground texture for TileSprite use
    // Copy just the grass frame (frame 0) into its own 16x16 texture
    var cTile = this._makeCanvas(scene, 'ground-tile', 16, 32);
    var ctxTile = cTile.ctx;
    // Grass top
    this._rect(ctxTile, 0, 0, 16, 2, P.GRASS_TOP);
    this._rect(ctxTile, 0, 2, 16, 2, P.GRASS_DARK);
    // Brick pattern
    this._rect(ctxTile, 0, 4, 16, 28, P.DIRT_CHECK);
    for (var yt = 4; yt < 32; yt += 4) {
      for (var xt = 0; xt < 24; xt += 8) {
        var offT = ((yt / 4) % 2 === 0) ? 0 : 4;
        var bxT = xt + offT;
        if (bxT < 16 && bxT >= 0) {
          var wT = Math.min(7, 16 - bxT);
          this._rect(ctxTile, bxT, yt, wT, 3, P.DIRT_BROWN);
          this._rect(ctxTile, bxT, yt + 3, wT, 1, P.DIRT_DARK);
        }
      }
    }
    cTile.tex.refresh();
  },

  // =========================================
  // FIREBALL - 8x8, 2 frames
  // =========================================
  _createFireball: function(scene) {
    var fw = 8, fh = 8, frames = 2;
    var c = this._makeCanvas(scene, 'fireball', fw * frames, fh);
    var ctx = c.ctx;
    var P = TangledTower.PALETTE;

    var pal = { 'F': P.DRAGON_FIRE, 'G': P.COIN_GOLD, 'R': P.HEART_RED };

    this._drawMap(ctx, 0, 0, [
      '..FF....',
      '.FFGF...',
      'FFGGFF..',
      'FGGGFF..',
      'FFGGFF..',
      '.FFGF...',
      '..FFF...',
      '...F....'
    ], pal);

    this._drawMap(ctx, fw, 0, [
      '...F....',
      '..FGF...',
      '.FGGFF..',
      'FGGGFF..',
      'FFGGFF..',
      '.FFFR...',
      '..FF....',
      '..F.....'
    ], pal);

    c.tex.refresh();
    this._addFrames(c.tex, fw, fh, frames);
  },

  // =========================================
  // WARNING ICON - 8x8
  // =========================================
  _createWarning: function(scene) {
    var c = this._makeCanvas(scene, 'warning', 8, 8);
    var ctx = c.ctx;
    var pal = { 'R': TangledTower.PALETTE.HEART_RED, 'W': TangledTower.PALETTE.WHITE };

    this._drawMap(ctx, 0, 0, [
      '...RR...',
      '..RWWR..',
      '..RWWR..',
      '..RWWR..',
      '...RR...',
      '...RR...',
      '..RWWR..',
      '...RR...'
    ], pal);

    c.tex.refresh();
    this._addFrames(c.tex, 8, 8, 1);
  },

  // =========================================
  // BOSS: GIANT TROLL - 32x32, 3 frames
  // =========================================
  _createBossTroll: function(scene) {
    var fw = 32, fh = 32, frames = 3;
    var c = this._makeCanvas(scene, 'boss-troll', fw * frames, fh);
    if (!c) return;
    var ctx = c.ctx;
    var P = TangledTower.PALETTE;

    // Draw troll procedurally (simpler than pixel map for large sprites)
    for (var f = 0; f < frames; f++) {
      var ox = f * fw;
      var armOff = f === 2 ? -6 : (f === 1 ? 2 : 0); // Attack raises arms

      // Body
      this._rect(ctx, ox + 10, 8, 12, 16, P.TROLL_BROWN);
      this._rect(ctx, ox + 11, 9, 10, 14, P.TROLL_LIGHT);

      // Head
      this._rect(ctx, ox + 11, 2, 10, 8, P.TROLL_BROWN);
      this._rect(ctx, ox + 12, 3, 8, 6, P.TROLL_LIGHT);
      // Eyes
      this._px(ctx, ox + 13, 5, P.GOBLIN_EYES);
      this._px(ctx, ox + 18, 5, P.GOBLIN_EYES);
      // Mouth
      this._rect(ctx, ox + 14, 7, 4, 1, P.TROLL_DARK);

      // Arms
      this._rect(ctx, ox + 5, 10 + armOff, 5, 10, P.TROLL_BROWN);
      this._rect(ctx, ox + 22, 10 + armOff, 5, 10, P.TROLL_BROWN);
      // Fists
      this._rect(ctx, ox + 4, 18 + armOff, 6, 4, P.TROLL_LIGHT);
      this._rect(ctx, ox + 22, 18 + armOff, 6, 4, P.TROLL_LIGHT);

      // Legs
      this._rect(ctx, ox + 11, 24, 4, 6, P.TROLL_DARK);
      this._rect(ctx, ox + 17, 24, 4, 6, P.TROLL_DARK);
      // Feet
      this._rect(ctx, ox + 10, 29, 6, 3, P.TROLL_BROWN);
      this._rect(ctx, ox + 16, 29, 6, 3, P.TROLL_BROWN);
    }

    c.tex.refresh();
    this._addFrames(c.tex, fw, fh, frames);
  },

  // =========================================
  // BOSS: VINE MONSTER - 28x32, 3 frames
  // =========================================
  _createBossVine: function(scene) {
    var fw = 28, fh = 32, frames = 3;
    var c = this._makeCanvas(scene, 'boss-vine', fw * frames, fh);
    if (!c) return;
    var ctx = c.ctx;
    var P = TangledTower.PALETTE;

    for (var f = 0; f < frames; f++) {
      var ox = f * fw;
      var spread = f === 2 ? 4 : 0; // Attack spreads vines

      // Main trunk
      this._rect(ctx, ox + 10, 4, 8, 28, P.VINE_BOSS_GRN);
      this._rect(ctx, ox + 11, 5, 6, 26, P.VINE_GREEN);

      // Eyes (glowing)
      this._rect(ctx, ox + 11, 8, 3, 3, P.GOBLIN_EYES);
      this._rect(ctx, ox + 16, 8, 3, 3, P.GOBLIN_EYES);

      // Mouth
      this._rect(ctx, ox + 13, 13, 4, 2, P.VINE_DARK);

      // Vine tentacles (left)
      this._rect(ctx, ox + 3 - spread, 6, 8, 3, P.VINE_GREEN);
      this._rect(ctx, ox + 1 - spread, 8, 3, 8, P.VINE_GREEN);
      // Thorns
      this._px(ctx, ox + 1 - spread, 10, P.THORN_RED);
      this._px(ctx, ox + 3 - spread, 12, P.THORN_RED);

      // Vine tentacles (right)
      this._rect(ctx, ox + 18 + spread, 6, 8, 3, P.VINE_GREEN);
      this._rect(ctx, ox + 24 + spread, 8, 3, 8, P.VINE_GREEN);
      this._px(ctx, ox + 26 + spread, 10, P.THORN_RED);
      this._px(ctx, ox + 24 + spread, 12, P.THORN_RED);

      // Root base
      this._rect(ctx, ox + 6, 28, 16, 4, P.VINE_DARK);
      this._rect(ctx, ox + 4, 30, 20, 2, P.VINE_BOSS_GRN);
    }

    c.tex.refresh();
    this._addFrames(c.tex, fw, fh, frames);
  },

  // =========================================
  // BOSS: GIANT BAT - 32x24, 3 frames
  // =========================================
  _createBossBat: function(scene) {
    var fw = 32, fh = 24, frames = 3;
    var c = this._makeCanvas(scene, 'boss-bat', fw * frames, fh);
    if (!c) return;
    var ctx = c.ctx;
    var P = TangledTower.PALETTE;

    for (var f = 0; f < frames; f++) {
      var ox = f * fw;
      var wingY = f === 0 ? -3 : (f === 2 ? 3 : 0);

      // Body
      this._rect(ctx, ox + 12, 8, 8, 10, P.BAT_PURPLE);
      this._rect(ctx, ox + 13, 9, 6, 8, P.BAT_DARK);

      // Head
      this._rect(ctx, ox + 13, 5, 6, 5, P.BAT_PURPLE);
      // Ears
      this._px(ctx, ox + 13, 3, P.BAT_PURPLE);
      this._px(ctx, ox + 14, 4, P.BAT_PURPLE);
      this._px(ctx, ox + 18, 3, P.BAT_PURPLE);
      this._px(ctx, ox + 17, 4, P.BAT_PURPLE);
      // Eyes
      this._rect(ctx, ox + 14, 7, 2, 2, P.BAT_EYES);
      this._rect(ctx, ox + 17, 7, 2, 2, P.BAT_EYES);
      // Fangs
      this._px(ctx, ox + 15, 10, P.WHITE);
      this._px(ctx, ox + 17, 10, P.WHITE);

      // Wings (left)
      this._rect(ctx, ox + 2, 8 + wingY, 10, 3, P.BAT_WING);
      this._rect(ctx, ox + 0, 9 + wingY, 6, 2, P.BAT_WING);
      this._rect(ctx, ox + 4, 7 + wingY, 8, 2, P.BAT_WING);

      // Wings (right)
      this._rect(ctx, ox + 20, 8 + wingY, 10, 3, P.BAT_WING);
      this._rect(ctx, ox + 26, 9 + wingY, 6, 2, P.BAT_WING);
      this._rect(ctx, ox + 20, 7 + wingY, 8, 2, P.BAT_WING);

      // Feet
      this._px(ctx, ox + 14, 18, P.BAT_DARK);
      this._px(ctx, ox + 18, 18, P.BAT_DARK);
    }

    c.tex.refresh();
    this._addFrames(c.tex, fw, fh, frames);
  },

  // =========================================
  // BOSS: DARK KNIGHT - 24x28, 3 frames
  // =========================================
  _createBossKnight: function(scene) {
    var fw = 24, fh = 28, frames = 3;
    var c = this._makeCanvas(scene, 'boss-knight', fw * frames, fh);
    if (!c) return;
    var ctx = c.ctx;
    var P = TangledTower.PALETTE;

    for (var f = 0; f < frames; f++) {
      var ox = f * fw;
      var swordX = f === 2 ? -6 : 0; // Attack swings sword

      // Helmet
      this._rect(ctx, ox + 8, 1, 8, 8, P.KNIGHT_BLACK);
      this._rect(ctx, ox + 9, 2, 6, 6, P.KNIGHT_DARK);
      // Visor slit
      this._rect(ctx, ox + 10, 4, 4, 2, P.KNIGHT_PURPLE);
      // Glowing eyes
      this._px(ctx, ox + 10, 5, P.BAT_EYES);
      this._px(ctx, ox + 13, 5, P.BAT_EYES);
      // Plume
      this._rect(ctx, ox + 11, 0, 2, 2, P.KNIGHT_PURPLE);

      // Armor body
      this._rect(ctx, ox + 7, 9, 10, 10, P.KNIGHT_BLACK);
      this._rect(ctx, ox + 8, 10, 8, 8, P.KNIGHT_DARK);
      // Purple accent
      this._rect(ctx, ox + 11, 10, 2, 8, P.KNIGHT_PURPLE);

      // Cape
      this._rect(ctx, ox + 5, 10, 3, 12, P.KNIGHT_PURPLE);
      this._rect(ctx, ox + 4, 12, 2, 10, P.KNIGHT_DARK);

      // Sword arm (right)
      this._rect(ctx, ox + 17 + swordX, 9, 4, 3, P.KNIGHT_BLACK);
      // Sword
      this._rect(ctx, ox + 19 + swordX, 4, 2, 14, P.SWORD_SILVER);
      this._px(ctx, ox + 19 + swordX, 3, P.SWORD_LIGHT);

      // Shield arm (left)
      this._rect(ctx, ox + 3, 10, 4, 6, P.KNIGHT_BLACK);
      this._rect(ctx, ox + 1, 11, 3, 5, P.KNIGHT_PURPLE);

      // Legs
      this._rect(ctx, ox + 8, 19, 4, 7, P.KNIGHT_BLACK);
      this._rect(ctx, ox + 13, 19, 4, 7, P.KNIGHT_BLACK);
      // Boots
      this._rect(ctx, ox + 7, 24, 5, 4, P.KNIGHT_DARK);
      this._rect(ctx, ox + 12, 24, 5, 4, P.KNIGHT_DARK);
    }

    c.tex.refresh();
    this._addFrames(c.tex, fw, fh, frames);
  },

  // =========================================
  // BOSS: DRAGON - 40x32, 3 frames
  // =========================================
  _createBossDragon: function(scene) {
    var fw = 40, fh = 32, frames = 3;
    var c = this._makeCanvas(scene, 'boss-dragon', fw * frames, fh);
    if (!c) return;
    var ctx = c.ctx;
    var P = TangledTower.PALETTE;

    for (var f = 0; f < frames; f++) {
      var ox = f * fw;
      var wingY = f === 0 ? -2 : (f === 1 ? 2 : 0);
      var mouthOpen = f === 2;

      // Body
      this._rect(ctx, ox + 14, 12, 14, 10, P.DRAGON_GREEN);
      this._rect(ctx, ox + 15, 14, 12, 6, P.DRAGON_DARK);
      // Belly
      this._rect(ctx, ox + 16, 16, 8, 4, P.DRAGON_BELLY);

      // Neck
      this._rect(ctx, ox + 8, 8, 8, 8, P.DRAGON_GREEN);
      this._rect(ctx, ox + 9, 10, 6, 5, P.DRAGON_BELLY);

      // Head
      this._rect(ctx, ox + 3, 4, 10, 8, P.DRAGON_GREEN);
      this._rect(ctx, ox + 4, 5, 8, 6, P.DRAGON_DARK);
      // Eye
      this._rect(ctx, ox + 5, 6, 3, 2, P.COIN_GOLD);
      this._px(ctx, ox + 6, 6, P.BLACK);
      // Nostril
      this._px(ctx, ox + 4, 9, P.DRAGON_DARK);
      // Horn
      this._px(ctx, ox + 6, 3, P.DRAGON_BELLY);
      this._px(ctx, ox + 9, 3, P.DRAGON_BELLY);
      // Mouth
      if (mouthOpen) {
        this._rect(ctx, ox + 3, 10, 8, 3, P.DRAGON_DARK);
        this._rect(ctx, ox + 4, 11, 6, 1, P.DRAGON_FIRE);
      } else {
        this._rect(ctx, ox + 3, 10, 8, 2, P.DRAGON_DARK);
      }

      // Wings
      this._rect(ctx, ox + 16, 4 + wingY, 12, 3, P.DRAGON_GREEN);
      this._rect(ctx, ox + 20, 2 + wingY, 10, 4, P.DRAGON_GREEN);
      this._rect(ctx, ox + 24, 0 + wingY, 8, 3, P.DRAGON_GREEN);
      // Wing membrane
      this._rect(ctx, ox + 18, 6 + wingY, 14, 6, P.DRAGON_DARK);

      // Tail
      this._rect(ctx, ox + 28, 16, 6, 4, P.DRAGON_GREEN);
      this._rect(ctx, ox + 32, 18, 4, 3, P.DRAGON_GREEN);
      this._rect(ctx, ox + 35, 20, 3, 2, P.DRAGON_GREEN);
      this._px(ctx, ox + 37, 20, P.DRAGON_FIRE); // Tail tip

      // Legs
      this._rect(ctx, ox + 16, 22, 4, 6, P.DRAGON_DARK);
      this._rect(ctx, ox + 24, 22, 4, 6, P.DRAGON_DARK);
      // Claws
      this._rect(ctx, ox + 15, 27, 6, 2, P.DRAGON_GREEN);
      this._rect(ctx, ox + 23, 27, 6, 2, P.DRAGON_GREEN);

      // Fire breath (attack frame only)
      if (mouthOpen) {
        this._rect(ctx, ox + 0, 10, 4, 2, P.DRAGON_FIRE);
        this._rect(ctx, ox + 1, 9, 2, 4, P.COIN_GOLD);
      }
    }

    c.tex.refresh();
    this._addFrames(c.tex, fw, fh, frames);
  },

  // =========================================
  // TOWER - 48x80
  // =========================================
  _createTower: function(scene) {
    var w = 48, h = 80;
    var c = this._makeCanvas(scene, 'tower', w, h);
    if (!c) return;
    var ctx = c.ctx;
    var P = TangledTower.PALETTE;

    // Main tower body
    this._rect(ctx, 8, 10, 32, 70, P.STONE_GRAY);

    // Brick pattern
    for (var y = 10; y < 80; y += 4) {
      for (var x = 8; x < 40; x += 8) {
        var brickOff = ((y / 4) % 2 === 0) ? 0 : 4;
        var bx = x + brickOff;
        if (bx < 40 && bx >= 8) {
          this._rect(ctx, bx, y + 3, Math.min(7, 40 - bx), 1, P.STONE_DARK);
        }
      }
      // Vertical mortar lines
      for (var vx = 8; vx < 40; vx += 8) {
        var vOff = ((y / 4) % 2 === 0) ? 0 : 4;
        this._px(ctx, vx + vOff, y, P.STONE_DARK);
      }
    }

    // Tower top / battlements
    this._rect(ctx, 4, 6, 40, 6, P.STONE_GRAY);
    for (var batt = 0; batt < 5; batt++) {
      this._rect(ctx, 4 + batt * 10, 0, 6, 8, P.STONE_GRAY);
      this._rect(ctx, 5 + batt * 10, 1, 4, 2, P.STONE_LIGHT);
    }

    // Window (arched)
    this._rect(ctx, 18, 16, 12, 16, P.BLACK);
    this._rect(ctx, 19, 14, 10, 4, P.BLACK);
    this._rect(ctx, 20, 13, 8, 2, P.BLACK);

    // Rapunzel in window
    this._rect(ctx, 22, 18, 4, 4, P.SKIN); // Face
    this._px(ctx, 23, 19, P.EYE_BLACK); // Eyes
    this._px(ctx, 25, 19, P.EYE_BLACK);
    this._rect(ctx, 20, 16, 8, 3, P.HAIR_GOLD); // Hair top
    this._rect(ctx, 22, 22, 4, 4, P.DRESS_PURPLE); // Dress

    // Golden hair flowing down
    var hairX = 30;
    for (var hy = 26; hy < 78; hy++) {
      var wave = Math.sin(hy * 0.15) * 3;
      this._rect(ctx, hairX + wave, hy, 3, 1, P.HAIR_GOLD);
      if (hy % 3 === 0) {
        this._px(ctx, hairX + wave + 1, hy, P.HAIR_SHINE);
      }
    }

    c.tex.refresh();
    this._addFrames(c.tex, w, h, 1);
  },

  // =========================================
  // PARALLAX BACKGROUNDS
  // =========================================
  _createBackgrounds: function(scene) {
    var P = TangledTower.PALETTE;

    // Far background (mountains) - 120x270 tileable
    var farW = 120, farH = 270;
    var cFar = this._makeCanvas(scene, 'bg-far', farW, farH);
    var ctxFar = cFar.ctx;

    // Mountain silhouettes
    var peaks = [
      { x: 15, h: 60 }, { x: 40, h: 80 }, { x: 60, h: 50 },
      { x: 85, h: 70 }, { x: 105, h: 55 }
    ];
    var baseY = 210;
    for (var i = 0; i < peaks.length; i++) {
      var pk = peaks[i];
      // Draw triangle mountain
      for (var my = 0; my < pk.h; my++) {
        var mw = Math.floor(my * 0.7);
        this._rect(ctxFar, pk.x - mw, baseY - pk.h + my, mw * 2, 1, 0x446644);
      }
    }
    // Fill below mountains
    this._rect(ctxFar, 0, baseY, farW, farH - baseY, 0x446644);

    cFar.tex.refresh();
    this._addFrames(cFar.tex, farW, farH, 1);

    // Mid background (trees far) - 80x270
    var midW = 80, midH = 270;
    var cMid = this._makeCanvas(scene, 'bg-mid', midW, midH);
    var ctxMid = cMid.ctx;

    baseY = 220;
    // Tree silhouettes
    var trees = [10, 25, 38, 52, 68];
    for (var t = 0; t < trees.length; t++) {
      var tx = trees[t];
      var th = 30 + (t % 3) * 10;
      // Canopy (circle-ish)
      for (var ty = 0; ty < th; ty++) {
        var tw = Math.floor(Math.sin(ty / th * Math.PI) * 10);
        this._rect(ctxMid, tx - tw, baseY - th + ty, tw * 2, 1, 0x336633);
      }
      // Trunk
      this._rect(ctxMid, tx - 2, baseY - 5, 4, 15, 0x443322);
    }
    this._rect(ctxMid, 0, baseY + 5, midW, midH - baseY, 0x336633);

    cMid.tex.refresh();
    this._addFrames(cMid.tex, midW, midH, 1);

    // Near background (close trees) - 60x270
    var nearW = 60, nearH = 270;
    var cNear = this._makeCanvas(scene, 'bg-near', nearW, nearH);
    var ctxNear = cNear.ctx;

    baseY = 226;
    var nearTrees = [12, 35, 55];
    for (var nt = 0; nt < nearTrees.length; nt++) {
      var nx = nearTrees[nt];
      var nh = 35 + (nt % 2) * 15;
      for (var ny = 0; ny < nh; ny++) {
        var nw = Math.floor(Math.sin(ny / nh * Math.PI) * 12);
        this._rect(ctxNear, nx - nw, baseY - nh + ny, nw * 2, 1, 0x227722);
      }
      this._rect(ctxNear, nx - 3, baseY - 5, 6, 18, 0x553311);
    }

    cNear.tex.refresh();
    this._addFrames(cNear.tex, nearW, nearH, 1);
  },

  // =========================================
  // STARS - 480x100
  // =========================================
  _createStars: function(scene) {
    var w = 480, h = 100;
    var c = this._makeCanvas(scene, 'stars', w, h);
    var ctx = c.ctx;

    // Random star positions (seeded-ish for consistency)
    var positions = [];
    for (var i = 0; i < 60; i++) {
      var sx = (i * 37 + 13) % w;
      var sy = (i * 23 + 7) % h;
      var bright = (i % 3 === 0) ? 0xFFFFFF : 0xAAAACC;
      this._px(ctx, sx, sy, bright);
      if (i % 5 === 0) {
        // Bigger star
        this._px(ctx, sx + 1, sy, bright);
        this._px(ctx, sx, sy + 1, bright);
      }
    }

    c.tex.refresh();
    this._addFrames(c.tex, w, h, 1);
  },

  // =========================================
  // CLOUD - 24x12, 2 frames
  // =========================================
  _createCloud: function(scene) {
    var fw = 24, fh = 12, frames = 2;
    var c = this._makeCanvas(scene, 'cloud', fw * frames, fh);
    var ctx = c.ctx;
    var P = TangledTower.PALETTE;

    // Small cloud
    this._rect(ctx, 6, 3, 12, 6, P.CLOUD_WHITE);
    this._rect(ctx, 4, 5, 16, 4, P.CLOUD_WHITE);
    this._rect(ctx, 8, 2, 8, 2, P.CLOUD_WHITE);
    this._rect(ctx, 7, 3, 4, 2, P.CLOUD_LIGHT);

    // Large cloud
    this._rect(ctx, fw + 4, 2, 16, 8, P.CLOUD_WHITE);
    this._rect(ctx, fw + 2, 4, 20, 6, P.CLOUD_WHITE);
    this._rect(ctx, fw + 8, 1, 8, 2, P.CLOUD_WHITE);
    this._rect(ctx, fw + 5, 2, 6, 3, P.CLOUD_LIGHT);

    c.tex.refresh();
    this._addFrames(c.tex, fw, fh, frames);
  },

  // =========================================
  // BITMAP PIXEL FONT - 5x7 glyphs
  // =========================================
  createBitmapFont: function(scene) {
    var glyphW = 5, glyphH = 7;
    var cellW = 6, cellH = 8; // 1px padding
    var cols = 16;
    var chars = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.:!?+-\'",;=';
    var rows = Math.ceil(chars.length / cols);
    var canvasW = cols * cellW;
    var canvasH = rows * cellH;

    // Glyph data: each char is 7 rows, each row is 5-bit number (MSB=left)
    var G = {
      ' ': [0,0,0,0,0,0,0],
      'A': [14,17,17,31,17,17,17],
      'B': [30,17,17,30,17,17,30],
      'C': [14,17,16,16,16,17,14],
      'D': [28,18,17,17,17,18,28],
      'E': [31,16,16,30,16,16,31],
      'F': [31,16,16,30,16,16,16],
      'G': [14,17,16,23,17,17,15],
      'H': [17,17,17,31,17,17,17],
      'I': [14,4,4,4,4,4,14],
      'J': [7,2,2,2,2,18,12],
      'K': [17,18,20,24,20,18,17],
      'L': [16,16,16,16,16,16,31],
      'M': [17,27,21,17,17,17,17],
      'N': [17,25,21,19,17,17,17],
      'O': [14,17,17,17,17,17,14],
      'P': [30,17,17,30,16,16,16],
      'Q': [14,17,17,17,21,18,13],
      'R': [30,17,17,30,20,18,17],
      'S': [15,16,16,14,1,1,30],
      'T': [31,4,4,4,4,4,4],
      'U': [17,17,17,17,17,17,14],
      'V': [17,17,17,17,17,10,4],
      'W': [17,17,17,21,21,21,10],
      'X': [17,17,10,4,10,17,17],
      'Y': [17,17,10,4,4,4,4],
      'Z': [31,1,2,4,8,16,31],
      '0': [14,17,19,21,25,17,14],
      '1': [4,12,4,4,4,4,14],
      '2': [14,17,1,2,4,8,31],
      '3': [31,2,4,2,1,17,14],
      '4': [2,6,10,18,31,2,2],
      '5': [31,16,30,1,1,17,14],
      '6': [6,8,16,30,17,17,14],
      '7': [31,1,2,4,8,8,8],
      '8': [14,17,17,14,17,17,14],
      '9': [14,17,17,15,1,2,12],
      '.': [0,0,0,0,0,0,4],
      ':': [0,0,4,0,0,4,0],
      '!': [4,4,4,4,4,0,4],
      '?': [14,17,1,6,4,0,4],
      '+': [0,4,4,31,4,4,0],
      '-': [0,0,0,14,0,0,0],
      '\'': [4,4,0,0,0,0,0],
      '"': [10,10,0,0,0,0,0],
      ',': [0,0,0,0,0,4,8],
      ';': [0,0,4,0,0,4,8],
      '=': [0,0,31,0,31,0,0]
    };

    // Two sizes: normal (white) and gold (for titles)
    var fonts = [
      { key: 'pixel-font', color: [255, 255, 255] },
      { key: 'pixel-font-gold', color: [255, 215, 0] }
    ];

    for (var f = 0; f < fonts.length; f++) {
      var fontDef = fonts[f];
      var tex = scene.textures.createCanvas(fontDef.key, canvasW, canvasH);
      var ctx = tex.getContext();
      ctx.imageSmoothingEnabled = false;

      var cr = fontDef.color[0], cg = fontDef.color[1], cb = fontDef.color[2];
      ctx.fillStyle = 'rgb(' + cr + ',' + cg + ',' + cb + ')';

      for (var i = 0; i < chars.length; i++) {
        var ch = chars[i];
        var glyph = G[ch];
        if (!glyph) continue;
        var col = i % cols;
        var row = Math.floor(i / cols);
        var ox = col * cellW;
        var oy = row * cellH;

        for (var gy = 0; gy < glyphH; gy++) {
          var bits = glyph[gy];
          for (var gx = 0; gx < glyphW; gx++) {
            if (bits & (1 << (glyphW - 1 - gx))) {
              ctx.fillRect(ox + gx, oy + gy, 1, 1);
            }
          }
        }
      }
      tex.refresh();

      // Register as RetroFont
      var fontConfig = {
        image: fontDef.key,
        width: cellW,
        height: cellH,
        chars: chars,
        charsPerRow: cols,
        offset: { x: 0, y: 0 },
        spacing: { x: 0, y: 0 }
      };
      scene.cache.bitmapFont.add(fontDef.key,
        Phaser.GameObjects.RetroFont.Parse(scene, fontConfig)
      );
    }
  }
};
