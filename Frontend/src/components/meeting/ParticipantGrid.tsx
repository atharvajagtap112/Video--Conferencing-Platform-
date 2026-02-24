import {
  useParticipants,
  useLocalParticipant,
  useTracks,
  VideoTrack,
  type TrackReferenceOrPlaceholder,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { motion, AnimatePresence } from "framer-motion";
import { useAppSelector } from "@/store";
import { ActiveSpeakerOverlay } from "./ActiveSpeakerOverlay";
import { cn } from "@/lib/utils";
import { Mic, MicOff } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, generateAvatarColor } from "@/lib/utils";

export function ParticipantGrid() {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const handRaisedUsers = useAppSelector(
    (state) => state.meeting.handRaisedUsers
  );

  const trackRefs = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  const count = trackRefs.length;

  const isLocal = (identity: string) =>
    identity === localParticipant.identity;

  const hasVideo = (trackRef: TrackReferenceOrPlaceholder): boolean => {
    return (
      trackRef.publication?.track !== undefined &&
      !trackRef.publication.isMuted
    );
  };

  // Calculate grid layout using inline styles for reliable height fill
  const getGridStyle = (): React.CSSProperties => {
    let cols = 1;
    let rows = 1;

    if (count === 1) { cols = 1; rows = 1; }
    else if (count === 2) { cols = 2; rows = 1; }
    else if (count <= 4) { cols = 2; rows = 2; }
    else if (count <= 6) { cols = 3; rows = 2; }
    else if (count <= 9) { cols = 3; rows = 3; }
    else if (count <= 16) { cols = 4; rows = Math.ceil(count / 4); }
    else { cols = 5; rows = Math.ceil(count / 5); }

    return {
      display: "grid",
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gridTemplateRows: `repeat(${rows}, 1fr)`,
      gap: "0.5rem",
      width: "100%",
      height: "100%",
    };
  };

  return (
    <div style={getGridStyle()}>
      <AnimatePresence mode="popLayout">
        {trackRefs.map((trackRef) => {
          const participant = trackRef.participant;
          const isLocalParticipant = isLocal(participant.identity);
          const hasHandRaised = handRaisedUsers.includes(
            participant.identity
          );
          const isCameraOn = hasVideo(trackRef);
          const isMicOn = participant.isMicrophoneEnabled;
          const name = participant.name || participant.identity;
          const isScreenShare =
            trackRef.source === Track.Source.ScreenShare;

          return (
            <motion.div
              key={participant.identity + trackRef.source}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "relative rounded-xl overflow-hidden bg-meeting-elevated border border-white/5",
                isLocalParticipant && !isScreenShare && "mirror-video"
              )}
              style={{ minHeight: 0 }}
            >
              {/* Video or Avatar */}
              {isCameraOn || isScreenShare ? (
                <div className="absolute inset-0">
                  {trackRef.publication?.track && (
                    <VideoTrack
                      trackRef={trackRef}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-meeting-elevated">
                  <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                    <AvatarFallback
                      className={cn(
                        generateAvatarColor(name),
                        "text-white text-2xl sm:text-3xl font-semibold"
                      )}
                    >
                      {getInitials(name)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}

              {/* Active speaker */}
              <ActiveSpeakerOverlay participant={participant} />

              {/* Hand raised */}
              {hasHandRaised && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3 h-8 w-8 flex items-center justify-center bg-yellow-500/90 rounded-full text-lg shadow-lg z-10"
                >
                  ✋
                </motion.div>
              )}

              {/* Name + mic bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 py-2.5 pt-10 z-10">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white drop-shadow-md truncate">
                    {name}
                    {isLocalParticipant && " (You)"}
                    {isScreenShare && " — Screen"}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {isMicOn ? (
                      <Mic className="h-3.5 w-3.5 text-white/70" />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-red-500/90 flex items-center justify-center">
                        <MicOff className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}