/**
 * AudioStreamer handles microphone input and audio playback for real-time AI interaction.
 */
export class AudioStreamer {
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private playbackQueue: Int16Array[] = [];
  private isPlaying = false;
  private nextStartTime = 0;

  constructor(private inputSampleRate: number = 16000, private outputSampleRate: number = 24000) {}

  async start(onAudioInput: (data: string) => void) {
    this.audioContext = new AudioContext({ sampleRate: this.inputSampleRate });
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.source = this.audioContext.createMediaStreamSource(this.stream);

    // Using ScriptProcessor for simplicity in this environment, though AudioWorklet is preferred.
    // ScriptProcessor is deprecated but widely supported for quick prototypes.
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
    
    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      // Convert Float32 to Int16
      const pcm16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7fff;
      }
      // Convert to Base64
      const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
      onAudioInput(base64);
    };

    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
    
    this.nextStartTime = this.audioContext.currentTime;
  }

  stop() {
    this.source?.disconnect();
    this.processor?.disconnect();
    this.stream?.getTracks().forEach(track => track.stop());
    this.audioContext?.close();
    this.audioContext = null;
    this.playbackQueue = [];
    this.isPlaying = false;
  }

  addAudioChunk(base64Data: string) {
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const pcm16 = new Int16Array(bytes.buffer);
    this.playbackQueue.push(pcm16);
    this.processQueue();
  }

  private async processQueue() {
    if (this.isPlaying || this.playbackQueue.length === 0 || !this.audioContext) return;

    this.isPlaying = true;
    while (this.playbackQueue.length > 0) {
      const pcm16 = this.playbackQueue.shift()!;
      await this.playChunk(pcm16);
    }
    this.isPlaying = false;
  }

  private playChunk(pcm16: Int16Array): Promise<void> {
    return new Promise((resolve) => {
      if (!this.audioContext) return resolve();

      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 0x7fff;
      }

      const buffer = this.audioContext.createBuffer(1, float32.length, this.outputSampleRate);
      buffer.getChannelData(0).set(float32);

      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);

      const startTime = Math.max(this.audioContext.currentTime, this.nextStartTime);
      source.start(startTime);
      this.nextStartTime = startTime + buffer.duration;

      source.onended = () => resolve();
    });
  }

  clearPlayback() {
    this.playbackQueue = [];
    // We can't easily stop already scheduled sources in this simple implementation
    // but we can reset the nextStartTime.
    if (this.audioContext) {
        this.nextStartTime = this.audioContext.currentTime;
    }
  }
}
