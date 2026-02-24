import { useIsSpeaking } from "@livekit/components-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Participant } from "livekit-client";

interface ActiveSpeakerOverlayProps {
  participant: Participant;
}

export function ActiveSpeakerOverlay({
  participant,
}: ActiveSpeakerOverlayProps) {
  const isSpeaking = useIsSpeaking(participant);

  return (
    <AnimatePresence>
      {isSpeaking && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 pointer-events-none"
        >
          {/* Glowing border */}
          <div className="absolute inset-0 rounded-xl border-2 border-primary shadow-[0_0_15px_rgba(79,70,229,0.4)]" />

          {/* Pulsing ring at bottom-left near name */}
          <div className="absolute bottom-3 left-14">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}