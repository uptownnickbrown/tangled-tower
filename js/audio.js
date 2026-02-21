// Tangled Tower - Procedural Chiptune Audio System
var TangledTower = TangledTower || {};

TangledTower.AudioGen = {
  ctx: null,
  masterGain: null,
  sfxGain: null,
  musicGain: null,
  _musicInterval: null,
  _musicNodes: [],
  muted: false,
  initialized: false,

  init: function() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.4;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.5;
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.25;
      this.musicGain.connect(this.masterGain);

      this.initialized = true;

      // Resume context if suspended (iOS requirement)
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (e) {
      console.warn('Audio not available:', e);
    }
  },

  toggleMute: function() {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : 0.4;
    }
    return this.muted;
  },

  // --- Sound Effects ---

  _playTone: function(type, startFreq, endFreq, duration, volume, destination) {
    if (!this.ctx) return;
    var now = this.ctx.currentTime;
    var osc = this.ctx.createOscillator();
    var gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, now);
    if (endFreq !== startFreq) {
      osc.frequency.linearRampToValueAtTime(endFreq, now + duration);
    }

    gain.gain.setValueAtTime(volume || 0.3, now);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    osc.connect(gain);
    gain.connect(destination || this.sfxGain);
    osc.start(now);
    osc.stop(now + duration);
  },

  _playNoise: function(duration, volume, filterFreq, destination) {
    if (!this.ctx) return;
    var now = this.ctx.currentTime;
    var bufferSize = this.ctx.sampleRate * duration;
    var buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    var noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    var gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume || 0.2, now);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    if (filterFreq) {
      var filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = filterFreq;
      noise.connect(filter);
      filter.connect(gain);
    } else {
      noise.connect(gain);
    }

    gain.connect(destination || this.sfxGain);
    noise.start(now);
    noise.stop(now + duration);
  },

  playJump: function() {
    this._playTone('square', 250, 500, 0.12, 0.25);
  },

  playDoubleJump: function() {
    this._playTone('square', 400, 700, 0.12, 0.25);
  },

  playCrouch: function() {
    this._playTone('triangle', 180, 100, 0.1, 0.15);
  },

  playCoin: function() {
    if (!this.ctx) return;
    var now = this.ctx.currentTime;
    // Two-note ding: B5 then E6
    this._playToneAt('square', 988, 0.05, 0.3, now);
    this._playToneAt('square', 1319, 0.08, 0.3, now + 0.06);
  },

  _playToneAt: function(type, freq, duration, volume, time) {
    if (!this.ctx) return;
    var osc = this.ctx.createOscillator();
    var gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(volume, time);
    gain.gain.linearRampToValueAtTime(0, time + duration);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + duration);
  },

  playHit: function() {
    this._playTone('sawtooth', 200, 80, 0.25, 0.3);
    this._playNoise(0.15, 0.15, 300);
  },

  playPowerUp: function() {
    if (!this.ctx) return;
    var now = this.ctx.currentTime;
    // Ascending arpeggio: C5-E5-G5-C6
    var notes = [523, 659, 784, 1047];
    for (var i = 0; i < notes.length; i++) {
      this._playToneAt('square', notes[i], 0.1, 0.25, now + i * 0.08);
    }
  },

  playShield: function() {
    this._playTone('triangle', 440, 880, 0.2, 0.2);
  },

  playSword: function() {
    this._playTone('sawtooth', 400, 100, 0.1, 0.25);
    this._playNoise(0.08, 0.2, 2000);
  },

  playEnemyDefeat: function() {
    if (!this.ctx) return;
    var now = this.ctx.currentTime;
    this._playToneAt('square', 523, 0.08, 0.25, now);
    this._playToneAt('square', 659, 0.08, 0.25, now + 0.08);
    this._playToneAt('square', 784, 0.12, 0.25, now + 0.16);
  },

  playBossAttack: function() {
    this._playTone('sawtooth', 100, 50, 0.2, 0.3);
    this._playNoise(0.15, 0.2, 200);
  },

  playBossWarning: function() {
    this._playTone('square', 660, 880, 0.15, 0.2);
  },

  playBossHurt: function() {
    if (!this.ctx) return;
    // Short descending pain tone
    this._playTone('triangle', 300, 150, 0.15, 0.3);
    this._playNoise(0.08, 0.15, 2000);
  },

  playDodgeSuccess: function() {
    if (!this.ctx) return;
    // Quick ascending ding
    var now = this.ctx.currentTime;
    this._playToneAt('square', 500, 0.08, 0.25, now);
    this._playToneAt('square', 700, 0.08, 0.25, now + 0.06);
    this._playToneAt('square', 900, 0.1, 0.25, now + 0.12);
  },

  playBossDefeat: function() {
    if (!this.ctx) return;
    var now = this.ctx.currentTime;
    var notes = [523, 659, 784, 1047, 1319];
    for (var i = 0; i < notes.length; i++) {
      this._playToneAt('square', notes[i], 0.12, 0.3, now + i * 0.12);
    }
  },

  playLevelComplete: function() {
    if (!this.ctx) return;
    var now = this.ctx.currentTime;
    // Ascending major scale
    var notes = [523, 587, 659, 698, 784, 880, 988, 1047];
    for (var i = 0; i < notes.length; i++) {
      this._playToneAt('square', notes[i], 0.12, 0.25, now + i * 0.1);
    }
  },

  playGameOver: function() {
    if (!this.ctx) return;
    var now = this.ctx.currentTime;
    // Descending sad: E4-C4-A3
    this._playToneAt('triangle', 330, 0.3, 0.3, now);
    this._playToneAt('triangle', 262, 0.3, 0.3, now + 0.3);
    this._playToneAt('triangle', 220, 0.5, 0.3, now + 0.6);
  },

  playVictory: function() {
    if (!this.ctx) return;
    var now = this.ctx.currentTime;
    // Triumphant fanfare
    var melody = [523, 523, 523, 659, 784, 784, 659, 784, 1047];
    var durs =   [0.1, 0.1, 0.15, 0.15, 0.1, 0.1, 0.15, 0.15, 0.4];
    var t = now;
    for (var i = 0; i < melody.length; i++) {
      this._playToneAt('square', melody[i], durs[i], 0.3, t);
      t += durs[i] + 0.02;
    }
  },

  playMenuSelect: function() {
    this._playTone('square', 660, 880, 0.1, 0.2);
  },

  playTyping: function() {
    this._playTone('square', 440, 440, 0.03, 0.08);
  },

  // --- Music System ---
  // Simple 4-channel chiptune sequencer

  // Note frequencies
  NOTES: {
    C3: 131, D3: 147, E3: 165, F3: 175, G3: 196, A3: 220, B3: 247,
    C4: 262, D4: 294, E4: 330, F4: 349, G4: 392, A4: 440, B4: 494,
    C5: 523, D5: 587, E5: 659, F5: 698, G5: 784, A5: 880, B5: 988,
    C6: 1047, R: 0
  },

  // Song data for each level - arrays of [note, duration_in_beats]
  SONGS: null,

  _initSongs: function() {
    var N = this.NOTES;
    this.SONGS = [
      // Level 1 - Bright Morning (C major, cheerful, 120 BPM)
      {
        bpm: 120,
        lead: [
          [N.C5,1],[N.E5,1],[N.G5,1],[N.E5,1],[N.C5,1],[N.D5,1],[N.E5,1],[N.C5,1],
          [N.F5,1],[N.A5,1],[N.G5,1],[N.F5,1],[N.E5,1],[N.D5,1],[N.C5,1],[N.R,1],
          [N.G5,1],[N.E5,1],[N.C5,1],[N.D5,1],[N.E5,1],[N.G5,1],[N.A5,1],[N.G5,1],
          [N.F5,1],[N.E5,1],[N.D5,1],[N.E5,1],[N.C5,2],[N.R,1],[N.R,1]
        ],
        bass: [
          [N.C3,2],[N.R,2],[N.G3,2],[N.R,2],
          [N.F3,2],[N.R,2],[N.G3,2],[N.R,2],
          [N.C3,2],[N.R,2],[N.E3,2],[N.R,2],
          [N.F3,2],[N.G3,2],[N.C3,2],[N.R,2]
        ]
      },
      // Level 2 - Golden Afternoon (G major, warm, 125 BPM)
      {
        bpm: 125,
        lead: [
          [N.G5,1],[N.A5,1],[N.B5,1],[N.A5,1],[N.G5,1],[N.E5,1],[N.D5,1],[N.E5,1],
          [N.G5,1],[N.B5,1],[N.A5,1],[N.G5,1],[N.E5,1],[N.D5,1],[N.C5,1],[N.D5,1],
          [N.E5,1],[N.G5,1],[N.A5,1],[N.B5,1],[N.C6,1],[N.B5,1],[N.A5,1],[N.G5,1],
          [N.A5,1],[N.G5,1],[N.E5,1],[N.D5,1],[N.G5,2],[N.R,1],[N.R,1]
        ],
        bass: [
          [N.G3,2],[N.R,2],[N.D3,2],[N.R,2],
          [N.E3,2],[N.R,2],[N.C3,2],[N.R,2],
          [N.G3,2],[N.R,2],[N.D3,2],[N.R,2],
          [N.C3,2],[N.D3,2],[N.G3,2],[N.R,2]
        ]
      },
      // Level 3 - Sunset (D minor, intense, 130 BPM)
      {
        bpm: 130,
        lead: [
          [N.D5,1],[N.F5,1],[N.A5,1],[N.G5,1],[N.F5,1],[N.E5,1],[N.D5,1],[N.C5,1],
          [N.D5,1],[N.E5,1],[N.F5,1],[N.G5,1],[N.A5,1],[N.G5,1],[N.F5,1],[N.E5,1],
          [N.A5,1],[N.G5,1],[N.F5,1],[N.E5,1],[N.D5,1],[N.F5,1],[N.E5,1],[N.D5,1],
          [N.C5,1],[N.D5,1],[N.E5,1],[N.F5,1],[N.D5,2],[N.R,1],[N.R,1]
        ],
        bass: [
          [N.D3,2],[N.R,2],[N.A3,2],[N.R,2],
          [N.B3,2],[N.R,2],[N.F3,2],[N.R,2],
          [N.D3,2],[N.R,2],[N.G3,2],[N.R,2],
          [N.A3,2],[N.D3,2],[N.D3,2],[N.R,2]
        ]
      },
      // Level 4 - Twilight (A minor, mysterious, 130 BPM)
      {
        bpm: 130,
        lead: [
          [N.A5,1],[N.E5,1],[N.A5,1],[N.B5,1],[N.C6,1],[N.B5,1],[N.A5,1],[N.G5,1],
          [N.F5,1],[N.E5,1],[N.D5,1],[N.E5,1],[N.F5,1],[N.G5,1],[N.A5,1],[N.R,1],
          [N.E5,1],[N.G5,1],[N.A5,1],[N.G5,1],[N.E5,1],[N.D5,1],[N.C5,1],[N.D5,1],
          [N.E5,1],[N.A5,1],[N.G5,1],[N.E5,1],[N.A5,2],[N.R,1],[N.R,1]
        ],
        bass: [
          [N.A3,2],[N.R,2],[N.E3,2],[N.R,2],
          [N.F3,2],[N.R,2],[N.C3,2],[N.R,2],
          [N.A3,2],[N.R,2],[N.D3,2],[N.R,2],
          [N.E3,2],[N.A3,2],[N.A3,2],[N.R,2]
        ]
      },
      // Level 5 - Moonlit Night (E minor, epic, 140 BPM)
      {
        bpm: 140,
        lead: [
          [N.E5,1],[N.G5,1],[N.B5,1],[N.A5,1],[N.G5,1],[N.E5,1],[N.D5,1],[N.E5,1],
          [N.B5,1],[N.A5,1],[N.G5,1],[N.E5,1],[N.D5,1],[N.E5,1],[N.G5,1],[N.A5,1],
          [N.B5,1],[N.C6,1],[N.B5,1],[N.A5,1],[N.G5,1],[N.A5,1],[N.B5,1],[N.G5,1],
          [N.E5,1],[N.G5,1],[N.B5,1],[N.A5,1],[N.E5,2],[N.R,1],[N.R,1]
        ],
        bass: [
          [N.E3,2],[N.R,2],[N.B3,2],[N.R,2],
          [N.G3,2],[N.R,2],[N.A3,2],[N.R,2],
          [N.E3,2],[N.R,2],[N.C3,2],[N.R,2],
          [N.B3,2],[N.E3,2],[N.E3,2],[N.R,2]
        ]
      },
      // Boss music (E minor, aggressive, 150 BPM)
      {
        bpm: 150,
        lead: [
          [N.E5,1],[N.E5,1],[N.G5,1],[N.E5,1],[N.D5,1],[N.E5,1],[N.R,1],[N.E5,1],
          [N.B5,1],[N.A5,1],[N.G5,1],[N.E5,1],[N.D5,1],[N.E5,1],[N.G5,1],[N.A5,1],
          [N.E5,1],[N.E5,1],[N.G5,1],[N.E5,1],[N.B5,1],[N.A5,1],[N.G5,1],[N.E5,1],
          [N.A5,1],[N.G5,1],[N.E5,1],[N.D5,1],[N.E5,2],[N.R,1],[N.R,1]
        ],
        bass: [
          [N.E3,1],[N.E3,1],[N.R,1],[N.E3,1],[N.G3,1],[N.E3,1],[N.R,1],[N.E3,1],
          [N.A3,1],[N.A3,1],[N.R,1],[N.A3,1],[N.B3,1],[N.A3,1],[N.R,1],[N.A3,1],
          [N.E3,1],[N.E3,1],[N.R,1],[N.E3,1],[N.G3,1],[N.E3,1],[N.R,1],[N.E3,1],
          [N.B3,1],[N.A3,1],[N.G3,1],[N.E3,1],[N.E3,2],[N.R,1],[N.R,1]
        ]
      }
    ];
  },

  startMusic: function(songIndex) {
    if (!this.ctx) return;
    if (!this.SONGS) this._initSongs();
    this.stopMusic();

    var song = this.SONGS[songIndex];
    if (!song) return;

    var self = this;
    var beatDuration = 60.0 / song.bpm;
    var leadIndex = 0;
    var bassIndex = 0;
    var leadBeatAccum = 0;
    var bassBeatAccum = 0;
    var nextBeatTime = this.ctx.currentTime + 0.1;
    var currentBeat = 0;

    this._musicInterval = setInterval(function() {
      if (!self.ctx) return;

      while (nextBeatTime < self.ctx.currentTime + 0.15) {
        // Lead melody (square wave)
        if (leadBeatAccum <= 0 && song.lead[leadIndex]) {
          var note = song.lead[leadIndex];
          if (note[0] > 0) {
            var osc = self.ctx.createOscillator();
            var gain = self.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(note[0], nextBeatTime);
            var noteDur = beatDuration * note[1] * 0.8;
            gain.gain.setValueAtTime(0.15, nextBeatTime);
            gain.gain.setValueAtTime(0.15, nextBeatTime + noteDur * 0.7);
            gain.gain.linearRampToValueAtTime(0, nextBeatTime + noteDur);
            osc.connect(gain);
            gain.connect(self.musicGain);
            osc.start(nextBeatTime);
            osc.stop(nextBeatTime + noteDur);
          }
          leadBeatAccum = note[1];
          leadIndex = (leadIndex + 1) % song.lead.length;
        }
        leadBeatAccum--;

        // Bass (triangle wave)
        if (bassBeatAccum <= 0 && song.bass[bassIndex]) {
          var bnote = song.bass[bassIndex];
          if (bnote[0] > 0) {
            var bosc = self.ctx.createOscillator();
            var bgain = self.ctx.createGain();
            bosc.type = 'triangle';
            bosc.frequency.setValueAtTime(bnote[0], nextBeatTime);
            var bnoteDur = beatDuration * bnote[1] * 0.8;
            bgain.gain.setValueAtTime(0.2, nextBeatTime);
            bgain.gain.setValueAtTime(0.2, nextBeatTime + bnoteDur * 0.6);
            bgain.gain.linearRampToValueAtTime(0, nextBeatTime + bnoteDur);
            bosc.connect(bgain);
            bgain.connect(self.musicGain);
            bosc.start(nextBeatTime);
            bosc.stop(nextBeatTime + bnoteDur);
          }
          bassBeatAccum = bnote[1];
          bassIndex = (bassIndex + 1) % song.bass.length;
        }
        bassBeatAccum--;

        // Simple percussion on beats 1 and 3
        if (currentBeat % 4 === 0) {
          // Kick
          self._playMusicPerc(nextBeatTime, 'kick');
        } else if (currentBeat % 4 === 2) {
          // Snare
          self._playMusicPerc(nextBeatTime, 'snare');
        }
        // Hi-hat on every beat
        self._playMusicPerc(nextBeatTime, 'hihat');

        nextBeatTime += beatDuration;
        currentBeat++;
      }
    }, 50);
  },

  _playMusicPerc: function(time, type) {
    if (!this.ctx) return;
    var bufSize, filterFreq, vol, dur;

    if (type === 'kick') {
      // Low thump
      var osc = this.ctx.createOscillator();
      var gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.linearRampToValueAtTime(50, time + 0.08);
      gain.gain.setValueAtTime(0.2, time);
      gain.gain.linearRampToValueAtTime(0, time + 0.08);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(time);
      osc.stop(time + 0.08);
    } else if (type === 'snare') {
      dur = 0.06;
      bufSize = Math.floor(this.ctx.sampleRate * dur);
      var buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
      var src = this.ctx.createBufferSource();
      src.buffer = buf;
      var f = this.ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 600;
      var g = this.ctx.createGain();
      g.gain.setValueAtTime(0.12, time);
      g.gain.linearRampToValueAtTime(0, time + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.musicGain);
      src.start(time);
      src.stop(time + dur);
    } else if (type === 'hihat') {
      dur = 0.025;
      bufSize = Math.floor(this.ctx.sampleRate * dur);
      var hbuf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      var hdata = hbuf.getChannelData(0);
      for (var j = 0; j < bufSize; j++) hdata[j] = Math.random() * 2 - 1;
      var hsrc = this.ctx.createBufferSource();
      hsrc.buffer = hbuf;
      var hf = this.ctx.createBiquadFilter();
      hf.type = 'highpass';
      hf.frequency.value = 8000;
      var hg = this.ctx.createGain();
      hg.gain.setValueAtTime(0.06, time);
      hg.gain.linearRampToValueAtTime(0, time + dur);
      hsrc.connect(hf);
      hf.connect(hg);
      hg.connect(this.musicGain);
      hsrc.start(time);
      hsrc.stop(time + dur);
    }
  },

  stopMusic: function() {
    if (this._musicInterval) {
      clearInterval(this._musicInterval);
      this._musicInterval = null;
    }
  }
};
