import { useCallback, useEffect, useRef } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  ConnectionStateToast,
  useLocalParticipant,
} from "@livekit/components-react";
import { useAppSelector } from "@/store";
import { useLiveKit } from "@/hooks/useLiveKit";
import { useSignaling } from "@/hooks/useSignaling";
import { meetingRecorder } from "@/services/meetingRecorder";
import { ParticipantGrid } from "./ParticipantGrid";
import { ControlBar } from "./ControlBar";
import { ChatPanel } from "./ChatPanel";
import { ParticipantList } from "./ParticipantList";
import { toast } from "react-hot-toast";

function RecordingManager() {
  const { localParticipant } = useLocalParticipant();
  const { meetingId } = useAppSelector((state) => state.meeting);
  const hasStartedRecording = useRef(false);

  useEffect(() => {
    if (!localParticipant || !meetingId || hasStartedRecording.current) return;

    const startRecording = async () => {
      try {
        console.log("Checking for microphone track...");
        
        // Wait for microphone track to be published
        let attempts = 0;
        let micTrack = null;
        
        while (attempts < 10 && !micTrack) {
          micTrack = localParticipant.getTrackPublication("microphone");
          if (!micTrack || !micTrack.track) {
            console.log(`Waiting for mic track... attempt ${attempts + 1}`);
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
          } else {
            break;
          }
        }
        
        if (!micTrack || !micTrack.track) {
          console.warn("No microphone track available for recording after 5 seconds");
          toast.error("Could not start recording - microphone not detected");
          return;
        }

        console.log("Microphone track found, starting recording...");
        await meetingRecorder.startRecording(meetingId, micTrack.track.mediaStreamTrack);
        hasStartedRecording.current = true;
        toast.success("🎙️ Recording started");
      } catch (error) {
        console.error("Failed to start recording:", error);
        toast.error("Failed to start recording");
      }
    };

    const timer = setTimeout(startRecording, 2000);
    return () => clearTimeout(timer);
  }, [localParticipant, meetingId]);

  return null;
}

export function VideoStage() {
  const { sfuToken, sfuUrl, isChatOpen, isParticipantListOpen } =
    useAppSelector((state) => state.meeting);

  const {
    onConnected,
    onDisconnected,
    onError,
    leaveRoom,
    closeRoom,
  } = useLiveKit();

  const { sendChatMessage, raiseHand, lowerHand } = useSignaling();

  const handleDisconnected = useCallback(() => {
    onDisconnected();
  }, [onDisconnected]);

  const handleLeave = useCallback(async () => {
    if (meetingRecorder.isActive()) {
      await meetingRecorder.stopRecording();
    }
    await leaveRoom();
  }, [leaveRoom]);

  const handleClose = useCallback(async () => {
    if (meetingRecorder.isActive()) {
      await meetingRecorder.stopRecording();
    }
    await closeRoom();
  }, [closeRoom]);

  if (!sfuToken || !sfuUrl) {
    return <div className="h-screen w-screen flex items-center justify-center">Connecting…</div>;
  }

  return (
    <LiveKitRoom
      token={sfuToken}
      serverUrl={sfuUrl}
      connect={true}
      onConnected={onConnected}
      onDisconnected={handleDisconnected}
      onError={onError}
      audio={true}
      video={true}
      style={{ height: "100vh", width: "100vw" }}
      className="flex flex-col meeting-gradient"
    >
      <RoomAudioRenderer />
      <ConnectionStateToast />
      <RecordingManager />

      <div className="flex flex-1 min-h-0 w-full">
        <div className="flex flex-col flex-1 min-w-0 min-h-0">
          <div className="flex-1 min-h-0 p-2">
            <ParticipantGrid />
          </div>

          <ControlBar
            onLeave={handleLeave}
            onClose={handleClose}
            onRaiseHand={raiseHand}
            onLowerHand={lowerHand}
          />
        </div>

        {isChatOpen && <ChatPanel onSendMessage={sendChatMessage} />}
        {isParticipantListOpen && <ParticipantList />}
      </div>
    </LiveKitRoom>
  );
}