import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/store";
import { useLiveKit } from "@/hooks/useLiveKit";
import { VideoStage } from "@/components/meeting/VideoStage";

export default function Room() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const {
    meeting: { sfuToken, connectionStatus },
    joinRoom,
  } = useLiveKit();

  const hasAttemptedJoin = useRef(false);

  // If user navigates directly to /room/:meetingId without joining first
  useEffect(() => {
    if (
      !sfuToken &&
      meetingId &&
      connectionStatus === "idle" &&
      !hasAttemptedJoin.current
    ) {
      hasAttemptedJoin.current = true;
      joinRoom(meetingId);
    }
  }, [sfuToken, meetingId, connectionStatus, joinRoom]);

  // ── Error state ──
  if (connectionStatus === "error") {
    return (
      <div className="min-h-screen meeting-gradient flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 max-w-md mx-auto px-6"
        >
          <div className="h-16 w-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Connection Failed</h1>
          <p className="text-muted-foreground">
            Could not connect to the meeting. The room may have expired, been
            closed, or the media server is unavailable.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
            {meetingId && (
              <Button
                onClick={() => {
                  hasAttemptedJoin.current = false;
                  joinRoom(meetingId);
                }}
              >
                Try Again
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Disconnected state ──
  if (connectionStatus === "disconnected") {
    return (
      <div className="min-h-screen meeting-gradient flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 max-w-md mx-auto px-6"
        >
          <h1 className="text-2xl font-bold">You left the meeting</h1>
          <p className="text-muted-foreground">
            The connection was closed. You can rejoin or go back to the
            dashboard.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
            {meetingId && (
              <Button
                onClick={() => {
                  hasAttemptedJoin.current = false;
                  joinRoom(meetingId);
                }}
              >
                Rejoin
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Have token → render VideoStage (it handles its own connection) ──
  if (sfuToken) {
    return <VideoStage />;
  }

  // ── Still fetching token (idle / connecting without token yet) ──
  return (
    <div className="min-h-screen meeting-gradient flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center space-y-4"
      >
        <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Joining meeting…</h2>
          <p className="text-sm text-muted-foreground font-mono">
            {meetingId}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Setting up your camera and microphone
        </p>
      </motion.div>
    </div>
  );
}