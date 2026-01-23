
// Web Audio API kullanarak offline Beat Üretici
// Harici dosya gerektirmez, matematiksel dalgalar kullanır.

class BeatEngine {
    private ctx: AudioContext | null = null;
    private isPlaying: boolean = false;
    private nextNoteTime: number = 0;
    private timerID: number | null = null;
    private tempo: number = 90;
    private lookahead: number = 25.0; // ms
    private scheduleAheadTime: number = 0.1; // s
    private current16thNote: number = 0;
  
    constructor() {
      // AudioContext'i başlatma (Tarayıcı uyumluluğu için)
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
  
    // Ses Motorunu Başlat (Kullanıcı etkileşimi şart)
    public async init() {
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
    }
  
    public start() {
      if (this.isPlaying) return;
      if (!this.ctx) return;
  
      this.isPlaying = true;
      this.current16thNote = 0;
      this.nextNoteTime = this.ctx.currentTime;
      this.scheduler();
    }
  
    public stop() {
      this.isPlaying = false;
      if (this.timerID) {
        window.clearTimeout(this.timerID);
      }
    }
  
    private scheduler() {
      if (!this.ctx) return;
  
      while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
        this.scheduleNote(this.current16thNote, this.nextNoteTime);
        this.nextNote();
      }
  
      if (this.isPlaying) {
        this.timerID = window.setTimeout(() => this.scheduler(), this.lookahead);
      }
    }
  
    private nextNote() {
      const secondsPerBeat = 60.0 / this.tempo;
      this.nextNoteTime += 0.25 * secondsPerBeat;
      this.current16thNote = (this.current16thNote + 1) % 16;
    }
  
    private scheduleNote(beatNumber: number, time: number) {
      if (!this.ctx) return;
  
      // Basit Boom Bap Ritmi (16'lık notalar)
      // Kick: 0, 10
      // Snare: 4, 12
      // HiHat: Her 2 adımda bir (0, 2, 4...)
  
      if (beatNumber === 0 || beatNumber === 10) {
        this.playKick(time);
      }
  
      if (beatNumber === 4 || beatNumber === 12) {
        this.playSnare(time);
      }
  
      if (beatNumber % 2 === 0) {
        this.playHiHat(time);
      }
    }
  
    // --- ENSTRÜMANLAR ---
  
    private playKick(time: number) {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
  
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
  
      gain.gain.setValueAtTime(0.8, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
  
      osc.start(time);
      osc.stop(time + 0.5);
    }
  
    private playSnare(time: number) {
      if (!this.ctx) return;
      // Noise buffer oluştur
      const bufferSize = this.ctx.sampleRate * 2; // 2 saniye
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
  
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 1000;
      const noiseEnvelope = this.ctx.createGain();
  
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseEnvelope);
      noiseEnvelope.connect(this.ctx.destination);
  
      noiseEnvelope.gain.setValueAtTime(0.5, time);
      noiseEnvelope.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
      
      noise.start(time);
      noise.stop(time + 0.2);
  
      // Snare Tone
      const osc = this.ctx.createOscillator();
      const oscEnv = this.ctx.createGain();
      osc.type = 'triangle';
      osc.connect(oscEnv);
      oscEnv.connect(this.ctx.destination);
      
      osc.frequency.setValueAtTime(100, time);
      oscEnv.gain.setValueAtTime(0.3, time);
      oscEnv.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
      
      osc.start(time);
      osc.stop(time + 0.1);
    }
  
    private playHiHat(time: number) {
      if (!this.ctx) return;
      // Noise (Closed HiHat)
      const bufferSize = this.ctx.sampleRate * 2; 
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
  
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 10000;
  
      const hp = this.ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 7000;
  
      const gain = this.ctx.createGain();
  
      noise.connect(bandpass);
      bandpass.connect(hp);
      hp.connect(gain);
      gain.connect(this.ctx.destination);
  
      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
  
      noise.start(time);
      noise.stop(time + 0.05);
    }
  }
  
  export const beatEngine = new BeatEngine();
