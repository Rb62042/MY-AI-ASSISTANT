import { useState, useEffect, useRef } from "react";
import { LiveSession, SessionState } from "./lib/live-session";
import { ZoyaOrb } from "./components/ZoyaOrb";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Settings, Info } from "lucide-react";

export default function App() {
  const [state, setState] = useState<SessionState>("idle");
  const sessionRef = useRef<LiveSession | null>(null);

  useEffect(() => {
    // Initialize session with API key
    const apiKey = process.env.GEMINI_API_KEY || "";
    if (apiKey) {
      sessionRef.current = new LiveSession(apiKey, (newState) => {
        setState(newState);
      });
    }

    return () => {
      sessionRef.current?.disconnect();
    };
  }, []);

  const handleToggle = async () => {
    if (state === "idle" || state === "error") {
      await sessionRef.current?.connect();
    } else {
      sessionRef.current?.disconnect();
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between p-8 overflow-hidden">
      <div className="futuristic-bg" />
      <div className="grid-overlay" />

      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-7xl flex items-center justify-between z-10"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-mono text-xs uppercase tracking-widest text-zinc-400">
            Puja System v1.0
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-white/5 transition-colors">
            <Settings className="w-5 h-5 text-zinc-500" />
          </button>
          <button className="p-2 rounded-full hover:bg-white/5 transition-colors">
            <Info className="w-5 h-5 text-zinc-500" />
          </button>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center z-10">
        <ZoyaOrb state={state} onClick={handleToggle} />
      </main>

      {/* Footer */}
      <motion.footer 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-7xl flex flex-col items-center gap-6 z-10"
      >
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-mono">Signal</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`w-1 h-3 rounded-full ${state !== 'idle' ? 'bg-purple-500' : 'bg-zinc-800'}`} />
              ))}
            </div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-mono">Latency</span>
            <span className={`text-xs font-mono ${state !== 'idle' ? 'text-white' : 'text-zinc-700'}`}>
              {state !== 'idle' ? '42ms' : '--'}
            </span>
          </div>
        </div>

        <p className="text-zinc-600 text-[10px] uppercase tracking-[0.3em] font-mono text-center max-w-xs leading-relaxed">
          Secure Voice-to-Voice Neural Interface. Powered by Gemini 3.1 Flash Live.
        </p>
      </motion.footer>

      {/* Background Decorative Elements */}
      <AnimatePresence>
        {state === "speaking" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-pink-500/20 blur-[120px] pointer-events-none"
          />
        )}
        {state === "listening" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-purple-500/20 blur-[120px] pointer-events-none"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
