import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, Loader2, AlertCircle } from "lucide-react";
import { SessionState } from "../lib/live-session";

interface ZoyaOrbProps {
  state: SessionState;
  onClick: () => void;
}

export const ZoyaOrb: React.FC<ZoyaOrbProps> = ({ state, onClick }) => {
  const getOrbColor = () => {
    switch (state) {
      case "idle":
        return "bg-zinc-800 shadow-[0_0_20px_rgba(39,39,42,0.5)]";
      case "connecting":
        return "bg-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.8)]";
      case "listening":
        return "bg-purple-500 shadow-[0_0_50px_rgba(168,85,247,0.9)]";
      case "speaking":
        return "bg-pink-500 shadow-[0_0_60px_rgba(236,72,153,1)]";
      case "error":
        return "bg-red-500 shadow-[0_0_40px_rgba(239,68,68,0.8)]";
      default:
        return "bg-zinc-800";
    }
  };

  const getOrbAnimation = () => {
    switch (state) {
      case "idle":
        return { scale: [1, 1.05, 1], opacity: [0.6, 0.8, 0.6] };
      case "connecting":
        return { rotate: 360, scale: [1, 1.1, 1] };
      case "listening":
        return { scale: [1, 1.2, 1], boxShadow: ["0 0 20px rgba(168,85,247,0.5)", "0 0 60px rgba(168,85,247,0.9)", "0 0 20px rgba(168,85,247,0.5)"] };
      case "speaking":
        return { scale: [1, 1.3, 1], boxShadow: ["0 0 30px rgba(236,72,153,0.6)", "0 0 80px rgba(236,72,153,1)", "0 0 30px rgba(236,72,153,0.6)"] };
      case "error":
        return { x: [-2, 2, -2, 2, 0] };
      default:
        return {};
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-12">
      <div className="relative group">
        {/* Outer Glow Rings */}
        <AnimatePresence>
          {(state === "listening" || state === "speaking") && (
            <>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                className={`absolute inset-0 rounded-full border-2 ${state === "listening" ? "border-purple-500/30" : "border-pink-500/30"}`}
              />
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 2.5, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                className={`absolute inset-0 rounded-full border-2 ${state === "listening" ? "border-purple-500/20" : "border-pink-500/20"}`}
              />
            </>
          )}
        </AnimatePresence>

        {/* Main Button/Orb */}
        <motion.button
          onClick={onClick}
          animate={getOrbAnimation()}
          transition={{
            duration: state === "connecting" ? 2 : 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`relative z-10 w-48 h-48 rounded-full flex items-center justify-center transition-colors duration-500 ${getOrbColor()}`}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
          
          <div className="flex flex-col items-center gap-2">
            {state === "idle" && <MicOff className="w-12 h-12 text-zinc-400" />}
            {state === "connecting" && <Loader2 className="w-12 h-12 text-white animate-spin" />}
            {state === "listening" && <Mic className="w-12 h-12 text-white" />}
            {state === "speaking" && (
              <div className="flex items-end gap-1 h-8">
                {[1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ height: [8, 32, 8] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                    className="w-1.5 bg-white rounded-full"
                  />
                ))}
              </div>
            )}
            {state === "error" && <AlertCircle className="w-12 h-12 text-white" />}
          </div>
        </motion.button>
      </div>

      {/* Status Text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        key={state}
        className="text-center"
      >
        <h2 className="text-2xl font-medium tracking-tight text-white mb-2">
          {state === "idle" && "Tap to wake Puja"}
          {state === "connecting" && "Connecting..."}
          {state === "listening" && "Puja is listening"}
          {state === "speaking" && "Puja is speaking"}
          {state === "error" && "Something went wrong"}
        </h2>
        <p className="text-zinc-500 text-sm uppercase tracking-[0.2em] font-mono">
          {state === "idle" && "Offline"}
          {state === "connecting" && "Establishing Link"}
          {state === "listening" && "Active Channel"}
          {state === "speaking" && "Voice Output"}
          {state === "error" && "System Failure"}
        </p>
      </motion.div>
    </div>
  );
};
