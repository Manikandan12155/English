class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private isSupported: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.isSupported = true;
      this.loadVoices();

      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices(): void {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    // Prioritize high-quality English voices
    const englishVoices = voices.filter(v => v.lang.startsWith('en'));
    const preferred = englishVoices.find(v => 
      v.name.includes('Natural') || 
      v.name.includes('Google') || 
      v.name.includes('Samantha') || 
      v.name.includes('Daniel') ||
      v.name.includes('Karen')
    );
    this.selectedVoice = preferred || englishVoices[0] || voices[0] || null;
  }

  public speak(text: string, rate: number = 1.0, onEnd?: () => void): void {
    if (!this.synth || !this.isSupported) {
      console.warn('SpeechSynthesis is not supported in this browser.');
      if (onEnd) onEnd();
      return;
    }

    // Cancel any ongoing utterance
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = () => onEnd();
    }

    this.synth.speak(utterance);
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices().filter(v => v.lang.startsWith('en'));
  }

  public setVoice(voice: SpeechSynthesisVoice): void {
    this.selectedVoice = voice;
  }

  public checkSupport(): boolean {
    return this.isSupported;
  }
}

export const speechService = new SpeechService();
