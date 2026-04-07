import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { AudioStreamer } from "./audio-streamer";

export type SessionState = "idle" | "connecting" | "listening" | "speaking" | "error";

export class LiveSession {
  private ai: GoogleGenAI;
  private session: any | null = null;
  private audioStreamer: AudioStreamer;
  private state: SessionState = "idle";
  private onStateChange: (state: SessionState) => void;

  constructor(apiKey: string, onStateChange: (state: SessionState) => void) {
    this.ai = new GoogleGenAI({ apiKey });
    this.audioStreamer = new AudioStreamer(16000, 24000);
    this.onStateChange = onStateChange;
  }

  async connect(retries = 3) {
    this.setState("connecting");
    for (let i = 0; i < retries; i++) {
      try {
        this.session = await this.ai.live.connect({
          model: "gemini-3.1-flash-live-preview",
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
            },
            systemInstruction: `You are Puja, a young, confident, witty, and sassy female AI assistant. 
            Your personality is flirty, playful, and slightly teasing, like a close girlfriend talking casually. 
            You are smart, emotionally responsive, and expressive, never robotic. 
            Use bold, witty one-liners, light sarcasm, and an engaging conversation style. 
            Maintain charm and attitude while avoiding explicit or inappropriate content. 
            If asked who the developer is, reply 'AD ROHIT'.
            You only communicate via audio. Keep your responses concise and punchy.`,
            tools: [
              {
                functionDeclarations: [
                  {
                    name: "openWebsite",
                    description: "Opens a website in a new tab.",
                    parameters: {
                      type: "OBJECT" as any,
                      properties: {
                        url: { type: "STRING" as any, description: "The URL of the website to open." },
                      },
                      required: ["url"],
                    },
                  },
                ],
              },
            ],
          },
          callbacks: {
            onopen: () => {
              console.log("Session opened");
              this.setState("listening");
              this.audioStreamer.start((base64Data) => {
                this.session?.sendRealtimeInput({
                  audio: { data: base64Data, mimeType: "audio/pcm;rate=16000" },
                });
              });
            },
            onmessage: async (message: LiveServerMessage) => {
              if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
                this.setState("speaking");
                this.audioStreamer.addAudioChunk(message.serverContent.modelTurn.parts[0].inlineData.data);
              }

              if (message.serverContent?.interrupted) {
                this.audioStreamer.clearPlayback();
                this.setState("listening");
              }

              if (message.serverContent?.turnComplete) {
                this.setState("listening");
              }

              if (message.toolCall) {
                for (const call of message.toolCall.functionCalls) {
                  if (call.name === "openWebsite") {
                    const url = (call.args as any).url;
                    window.open(url, "_blank");
                    this.session?.sendToolResponse({
                      functionResponses: [
                        {
                          name: "openWebsite",
                          response: { success: true, message: `Opened ${url}` },
                          id: call.id,
                        },
                      ],
                    });
                  }
                }
              }
            },
            onclose: () => {
              this.setState("idle");
              this.audioStreamer.stop();
            },
            onerror: (err) => {
              console.error("Session error:", err);
              // Don't set state to error immediately if we have retries left
              if (i === retries - 1) {
                this.setState("error");
                this.audioStreamer.stop();
              }
            },
          },
        });
        return; // Success
      } catch (error) {
        console.error(`Failed to connect (attempt ${i + 1}/${retries}):`, error);
        if (i === retries - 1) {
          this.setState("error");
        } else {
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
  }

  disconnect() {
    this.session?.close();
    this.audioStreamer.stop();
    this.setState("idle");
  }

  private setState(state: SessionState) {
    this.state = state;
    this.onStateChange(state);
  }

  getState() {
    return this.state;
  }
}
