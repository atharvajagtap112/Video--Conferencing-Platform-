import { motion } from "framer-motion";
import {
  useParticipants,
  useLocalParticipant,
} from "@livekit/components-react";
import { X, Mic, MicOff, Video, VideoOff, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAppDispatch, useAppSelector } from "@/store";
import { toggleParticipantList } from "@/store/meeting.store";
import { getInitials, generateAvatarColor } from "@/lib/utils";

export function ParticipantList() {
  const dispatch = useAppDispatch();
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const { handRaisedUsers } = useAppSelector((state) => state.meeting);

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 320, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-full flex flex-col border-l border-white/5 bg-meeting-surface overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <h3 className="font-semibold text-sm">
          People ({participants.length})
        </h3>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => dispatch(toggleParticipantList())}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Participant items */}
      <div className="flex-1 overflow-y-auto py-2">
        {participants.map((participant) => {
          const isLocal =
            participant.identity === localParticipant.identity;
          const name = participant.name || participant.identity;
          const hasHandRaised = handRaisedUsers.includes(
            participant.identity
          );

          return (
            <motion.div
              key={participant.identity}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors"
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback
                  className={`${generateAvatarColor(name)} text-white text-xs`}
                >
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium truncate flex items-center gap-1.5">
                  {name}
                  {isLocal && (
                    <span className="text-xs text-muted-foreground">(You)</span>
                  )}
                  {/* First participant is typically the host */}
                  {participant.permissions?.canPublish &&
                    participant.permissions?.recorder && (
                      <Crown className="h-3 w-3 text-yellow-500" />
                    )}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {hasHandRaised && <span className="text-sm">✋</span>}

                {participant.isMicrophoneEnabled ? (
                  <Mic className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <MicOff className="h-3.5 w-3.5 text-destructive" />
                )}

                {participant.isCameraEnabled ? (
                  <Video className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <VideoOff className="h-3.5 w-3.5 text-destructive" />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}