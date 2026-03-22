import { useState, useEffect } from "react";
import {
  useLocalParticipant,
  useRoomContext,
} from "@livekit/components-react";
import { Track, RoomEvent } from "livekit-client";
import { motion } from "framer-motion";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  ScreenShareOff,
  Phone,
  Hand,
  MessageSquare,
  Users,
  DoorClosed,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppDispatch, useAppSelector } from "@/store";
import { toggleChat, toggleParticipantList } from "@/store/meeting.store";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface ControlBarProps {

  onLeave: () => Promise<void>;   // changed
  onClose: () => Promise<void>;   // changed
  onRaiseHand: () => void;
  onLowerHand: () => void;

  
}

export function ControlBar({
  onLeave,
  onClose,
  onRaiseHand,
  onLowerHand,
}: ControlBarProps) {
  const dispatch = useAppDispatch();
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const {
    role,
    meetingId,
    isChatOpen,
    isParticipantListOpen,
    unreadChatCount,
    handRaisedUsers,
  } = useAppSelector((state) => state.meeting);
  const { user } = useAppSelector((state) => state.auth);

  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const isMicOn = localParticipant.isMicrophoneEnabled;
  const isCamOn = localParticipant.isCameraEnabled;
  const isHost = role === "HOST";
  const isHandRaised = user ? handRaisedUsers.includes(user.username) : false;

  // Listen for screen share ending via browser "Stop sharing" button
  useEffect(() => {
    const handleTrackUnpublished = () => {
      // Re-check if we're still screen sharing
      const hasScreenShare = localParticipant
        .getTrackPublications()
        .some(
          (pub) =>
            pub.source === Track.Source.ScreenShare && pub.track !== undefined
        );
      if (!hasScreenShare) {
        setIsScreenSharing(false);
      }
    };

    room.on(RoomEvent.LocalTrackUnpublished, handleTrackUnpublished);
    return () => {
      room.off(RoomEvent.LocalTrackUnpublished, handleTrackUnpublished);
    };
  }, [room, localParticipant]);

  const toggleMic = async () => {
    await localParticipant.setMicrophoneEnabled(!isMicOn);
  };

  const toggleCamera = async () => {
    await localParticipant.setCameraEnabled(!isCamOn);
  };

  const toggleScreenShare = async () => {
    try {
      await localParticipant.setScreenShareEnabled(!isScreenSharing);
      setIsScreenSharing(!isScreenSharing);
    } catch {
      toast.error("Screen sharing was cancelled or is not supported.");
      setIsScreenSharing(false);
    }
  };

  const handleToggleHand = () => {
    if (isHandRaised) {
      onLowerHand();
    } else {
      onRaiseHand();
    }
  };

  const copyMeetingId = async () => {
    if (!meetingId) return;
    await navigator.clipboard.writeText(meetingId);
    setCopied(true);
    toast.success("Meeting ID copied!");
    setTimeout(() => setCopied(false), 2000);
  };
    const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
   const handleLeave = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      await onLeave();

      // guest/user leave => dashboard
      // host can also leave (without ending for all) => dashboard
      navigate("/dashboard");
    } catch {
      toast.error("Failed to leave room.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      await onClose();

      // Host ended meeting => summary page
      if (meetingId) navigate(`/meeting/${meetingId}/summary`);
      else navigate("/dashboard");
    } catch {
      toast.error("Failed to end meeting.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="flex items-center justify-between px-4 py-3 glass border-t border-white/5 bottom-0  w-full"
    >
      {/* Left: Meeting info */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-sm font-mono text-muted-foreground truncate hidden sm:block">
          {meetingId}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={copyMeetingId}>
              {copied ? (
                <Check className="h-3.5 w-3.5 text-meeting-success" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy Meeting ID</TooltipContent>
        </Tooltip>
      </div>

      {/* Center: Main controls */}
      <div className="flex items-center gap-2">
        {/* Mic */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isMicOn ? "meeting" : "meeting-danger"}
              size="icon-lg"
              onClick={toggleMic}
              className="rounded-full"
            >
              {isMicOn ? (
                <Mic className="h-5 w-5" />
              ) : (
                <MicOff className="h-5 w-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isMicOn ? "Mute" : "Unmute"}</TooltipContent>
        </Tooltip>

        {/* Camera */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isCamOn ? "meeting" : "meeting-danger"}
              size="icon-lg"
              onClick={toggleCamera}
              className="rounded-full"
            >
              {isCamOn ? (
                <Video className="h-5 w-5" />
              ) : (
                <VideoOff className="h-5 w-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isCamOn ? "Turn off camera" : "Turn on camera"}
          </TooltipContent>
        </Tooltip>

        {/* Screen Share */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isScreenSharing ? "meeting-success" : "meeting"}
              size="icon-lg"
              onClick={toggleScreenShare}
              className="rounded-full"
            >
              {isScreenSharing ? (
                <ScreenShareOff className="h-5 w-5" />
              ) : (
                <ScreenShare className="h-5 w-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isScreenSharing ? "Stop sharing" : "Share screen"}
          </TooltipContent>
        </Tooltip>

        {/* Hand raise */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isHandRaised ? "meeting-success" : "meeting"}
              size="icon-lg"
              onClick={handleToggleHand}
              className={cn("rounded-full", isHandRaised && "animate-pulse")}
            >
              <Hand className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isHandRaised ? "Lower hand" : "Raise hand"}
          </TooltipContent>
        </Tooltip>

        {/* Leave / End */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="meeting-danger"
              size="icon-lg"
              onClick={isHost ? handleClose : handleLeave}
              className="rounded-full ml-2"
               disabled={isSubmitting}
            >
              {isHost ? (
                <DoorClosed className="h-5 w-5" />
              ) : (
                <Phone className="h-5 w-5 rotate-[135deg]" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isHost ? "End meeting for all" : "Leave meeting"}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Right: Side panel toggles */}
      <div className="flex items-center gap-1">
        {/* Chat toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isChatOpen ? "secondary" : "ghost"}
              size="icon"
              onClick={() => dispatch(toggleChat())}
              className="relative"
            >
              <MessageSquare className="h-4 w-4" />
              {unreadChatCount > 0 && !isChatOpen && (
                <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-primary text-[10px] font-bold text-white rounded-full">
                  {unreadChatCount > 9 ? "9+" : unreadChatCount}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Chat</TooltipContent>
        </Tooltip>

        {/* Participants toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isParticipantListOpen ? "secondary" : "ghost"}
              size="icon"
              onClick={() => dispatch(toggleParticipantList())}
            >
              <Users className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Participants</TooltipContent>
        </Tooltip>
      </div>
    </motion.div>
  );
}