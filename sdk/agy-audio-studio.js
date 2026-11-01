/**
 * Antigravity MAG v2.0 — Polyphonic WebAudio Studio & 4-Track Adaptive Sequencer
 * Includes algorithmic convolution reverb, dynamics compressor, 10 tactile SFX synthesizers,
 * and a 4-track adaptive soundtrack (Sub-Bass, Arpeggiator, Pad Chords, Percussion Groove).
 */
(function(root) {
  'use strict';

  class AGYAudioStudio {
    constructor() {
      this.ctx = null;
      this.masterGain = null;
      this.compressor = null;
      this.convolver = null;
      this.reverbGain = null;
      this.noiseBuffer = null;
      this.isInitialized = false;
      this.bgmTimer = null;
      this.bgmPlaying = false;
      this.musicIntensity = 'EXPLORATION'; // EXPLORATION | PUZZLE_TENSION | BOSS_FINALE
    }

    init() {
      if (this.isInitialized && this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return this.ctx;
      }

      const AudioCtx = (typeof window !== 'undefined') && (window.AudioContext || window.webkitAudioContext);
      if (!AudioCtx) return null;

      this.ctx = new AudioCtx();
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.82, this.ctx.currentTime);

      // Algorithmic Convolution Reverb
      this.convolver = this.ctx.createConvolver();
      this.convolver.buffer = this.buildImpulseResponse(1.4, 2.2);
      this.reverbGain = this.ctx.createGain();
      this.reverbGain.gain.setValueAtTime(0.22, this.ctx.currentTime);

      this.masterGain.connect(this.compressor);
      this.masterGain.connect(this.convolver);
      this.convolver.connect(this.reverbGain);
      this.reverbGain.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);

      this.buildWhiteNoiseBuffer();
      this.isInitialized = true;
      return this.ctx;
    }

    buildImpulseResponse(durationSec = 1.4, decay = 2.0) {
      if (!this.ctx) return null;
      const rate = this.ctx.sampleRate;
      const length = Math.floor(rate * durationSec);
      const impulse = this.ctx.createBuffer(2, length, rate);
      for (let ch = 0; ch < 2; ch++) {
        const channelData = impulse.getChannelData(ch);
        for (let i = 0; i < length; i++) {
          channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
        }
      }
      return impulse;
    }

    buildWhiteNoiseBuffer() {
      if (!this.ctx) return;
      const length = this.ctx.sampleRate * 2;
      this.noiseBuffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const out = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        out[i] = Math.random() * 2 - 1;
      }
    }

    ensureContext() {
      if (!this.ctx) this.init();
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    }

    playJump() {
      this.ensureContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(185, now);
      osc.frequency.exponentialRampToValueAtTime(480, now + 0.14);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.32, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.17);
    }

    playLand() {
      this.ensureContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(135, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.11);

      gain.gain.setValueAtTime(0.36, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.13);

      if (this.noiseBuffer) {
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const flt = this.ctx.createBiquadFilter();
        flt.type = 'lowpass';
        flt.frequency.setValueAtTime(360, now);
        const ng = this.ctx.createGain();
        ng.gain.setValueAtTime(0.22, now);
        ng.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        src.connect(flt);
        flt.connect(ng);
        ng.connect(this.masterGain);
        src.start(now);
        src.stop(now + 0.10);
      }
    }

    playP1Ability() {
      this.ensureContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const flt = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(550, now + 0.22);

      flt.type = 'bandpass';
      flt.frequency.setValueAtTime(820, now);
      flt.Q.setValueAtTime(3.8, now);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.connect(flt);
      flt.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.25);
    }

    playP2Ability() {
      this.ensureContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const flt = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(680, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.24);

      flt.type = 'lowpass';
      flt.frequency.setValueAtTime(1600, now);

      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(flt);
      flt.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.26);
    }

    playTetherSnap() {
      this.ensureContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(920, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.3);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.33);
    }

    playSwitchActivate() {
      this.ensureContext();
      if (!this.ctx) return;
      [440, 554.37, 659.25].forEach((freq, i) => {
        const start = this.ctx.currentTime + i * 0.055;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.28, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(start);
        osc.stop(start + 0.17);
      });
    }

    playGateOpen() {
      this.ensureContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [220, 330, 440].forEach(base => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(base, now);
        osc.frequency.exponentialRampToValueAtTime(base * 2, now + 0.55);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.62);
      });
    }

    playBossHit() {
      this.ensureContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.35);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.4);
    }

    playPartnerBoop() {
      this.ensureContext();
      if (!this.ctx) return;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const start = this.ctx.currentTime + idx * 0.045;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.26, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(start);
        osc.stop(start + 0.13);
      });
    }

    playVictoryFanfare() {
      this.ensureContext();
      if (!this.ctx) return;
      const notes = [
        { f: 392.0, d: 0.15, o: 0.0 },
        { f: 523.25, d: 0.15, o: 0.16 },
        { f: 659.25, d: 0.15, o: 0.32 },
        { f: 783.99, d: 0.25, o: 0.48 },
        { f: 1046.5, d: 0.65, o: 0.76 }
      ];
      notes.forEach(n => {
        const start = this.ctx.currentTime + n.o;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, start);
        gain.gain.setValueAtTime(0.36, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + n.d);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(start);
        osc.stop(start + n.d + 0.03);
      });
    }

    setMusicIntensity(mode = 'EXPLORATION') {
      this.musicIntensity = mode;
    }

    /**
     * 4-Track Adaptive Procedural Soundtrack Sequencer
     */
    startAdaptiveMusic(bpm = 114) {
      if (this.bgmPlaying) return;
      this.ensureContext();
      if (!this.ctx) return;

      this.bgmPlaying = true;
      const chords = [
        [220.0, 261.63, 329.63, 440.0],
        [174.61, 220.0, 261.63, 349.23],
        [196.0, 246.94, 293.66, 392.0],
        [164.81, 196.0, 246.94, 329.63]
      ];
      let step = 0;
      let chordIdx = 0;

      const tick = () => {
        if (!this.bgmPlaying || !this.ctx) return;
        const effectiveBpm = this.musicIntensity === 'BOSS_FINALE' ? bpm + 18 : bpm;
        const stepSec = (60 / effectiveBpm) / 2;
        const now = this.ctx.currentTime;
        const chord = chords[chordIdx];

        // Track 1: Arpeggiator
        const arpOsc = this.ctx.createOscillator();
        const arpGain = this.ctx.createGain();
        arpOsc.type = this.musicIntensity === 'BOSS_FINALE' ? 'sawtooth' : 'triangle';
        arpOsc.frequency.setValueAtTime(chord[step % chord.length], now);
        arpGain.gain.setValueAtTime(0.06, now);
        arpGain.gain.exponentialRampToValueAtTime(0.0001, now + stepSec * 0.85);
        arpOsc.connect(arpGain);
        arpGain.connect(this.masterGain);
        arpOsc.start(now);
        arpOsc.stop(now + stepSec);

        // Track 2: Sub-Bass on downbeats
        if (step % 2 === 0) {
          const bassOsc = this.ctx.createOscillator();
          const bassGain = this.ctx.createGain();
          bassOsc.type = 'sine';
          bassOsc.frequency.setValueAtTime(chord[0] * 0.5, now);
          bassGain.gain.setValueAtTime(0.11, now);
          bassGain.gain.exponentialRampToValueAtTime(0.001, now + stepSec * 1.8);
          bassOsc.connect(bassGain);
          bassGain.connect(this.masterGain);
          bassOsc.start(now);
          bassOsc.stop(now + stepSec * 1.9);
        }

        // Track 3: Warm Pad Chords on step 0
        if (step === 0) {
          const padOsc = this.ctx.createOscillator();
          const padGain = this.ctx.createGain();
          padOsc.type = 'sine';
          padOsc.frequency.setValueAtTime(chord[1], now);
          padGain.gain.setValueAtTime(0.04, now);
          padGain.gain.exponentialRampToValueAtTime(0.001, now + stepSec * 3.8);
          padOsc.connect(padGain);
          padGain.connect(this.masterGain);
          padOsc.start(now);
          padOsc.stop(now + stepSec * 3.9);
        }

        // Track 4: Percussion Hi-Hat groove when in Puzzle Tension or Boss Finale
        if ((this.musicIntensity !== 'EXPLORATION' || step % 2 === 1) && this.noiseBuffer) {
          const hat = this.ctx.createBufferSource();
          hat.buffer = this.noiseBuffer;
          const hp = this.ctx.createBiquadFilter();
          hp.type = 'highpass';
          hp.frequency.setValueAtTime(6000, now);
          const hg = this.ctx.createGain();
          hg.gain.setValueAtTime(0.035, now);
          hg.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
          hat.connect(hp);
          hp.connect(hg);
          hg.connect(this.masterGain);
          hat.start(now);
          hat.stop(now + 0.045);
        }

        step++;
        if (step >= 4) {
          step = 0;
          chordIdx = (chordIdx + 1) % chords.length;
        }
        this.bgmTimer = setTimeout(tick, stepSec * 1000);
      };

      tick();
    }

    stopAdaptiveMusic() {
      this.bgmPlaying = false;
      if (this.bgmTimer) clearTimeout(this.bgmTimer);
    }
  }

  const instance = new AGYAudioStudio();
  if (typeof window !== 'undefined') {
    window.AGYAudio = instance;
    window.MAGAudio = instance;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = instance;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
