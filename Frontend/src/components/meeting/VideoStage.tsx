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
  const { onConnected, onDisconnected, onError, leaveRoom, closeRoom } =
    useLiveKit();
  const { sendChatMessage, raiseHand, lowerHand } = useSignaling();

  const handleDisconnected = useCallback(() => {
    onDisconnected();
  }, [onDisconnected]);

  if (!sfuToken || !sfuUrl) {
    return (
      <div className="h-screen w-screen flex items-center justify-center meeting-gradient">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Connecting to media server…</p>
        </div>
      </div>
    );
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
      data-lk-theme="default"
      style={{ height: "100vh", width: "100vw" }}
      className="flex flex-col meeting-gradient"
      options={{
        publishDefaults: {
          simulcast: true,
          videoCodec: "vp8",
        },
        adaptiveStream: true,
        dynacast: true,
      }}
    >
      <RoomAudioRenderer />
      <ConnectionStateToast />

      {/* Main layout: fills entire screen */}
      <div className="flex flex-1 min-h-0 w-full">
        {/* Video area — takes all remaining space */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0">
          {/* Participant grid — fills all space above control bar */}
          <div className="flex-1 min-h-0 p-2">
            <ParticipantGrid />
          </div>

          {/* Control bar pinned to bottom */}
          <ControlBar
            onLeave={leaveRoom}
            onClose={closeRoom}
            onRaiseHand={raiseHand}
            onLowerHand={lowerHand}
          />
        </div>

        {/* Side panels */}
        {isChatOpen && <ChatPanel onSendMessage={sendChatMessage} />}
        {isParticipantListOpen && <ParticipantList />}
      </div>
    </LiveKitRoom>
  );
}