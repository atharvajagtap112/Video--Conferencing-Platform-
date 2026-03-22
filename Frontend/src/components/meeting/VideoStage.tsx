import { useCallback } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  ConnectionStateToast,
} from "@livekit/components-react";
import { useAppSelector } from "@/store";
import { useLiveKit } from "@/hooks/useLiveKit";
import { useSignaling } from "@/hooks/useSignaling";
import { ParticipantGrid } from "./ParticipantGrid";
import { ControlBar } from "./ControlBar";
import { ChatPanel } from "./ChatPanel";
import { ParticipantList } from "./ParticipantList";

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
    await leaveRoom(); // ensure your hook returns Promise<void>
  }, [leaveRoom]);

  const handleClose = useCallback(async () => {
    await closeRoom(); // ensure your hook returns Promise<void>
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