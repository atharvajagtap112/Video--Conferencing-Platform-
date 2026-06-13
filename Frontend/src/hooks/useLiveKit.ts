import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { roomApi } from "@/api/room.api";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  setMeetingInfo,
  setConnectionStatus,
  resetMeeting,
} from "@/store/meeting.store";

export function useLiveKit() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const meeting = useAppSelector((state) => state.meeting);
  const [isJoining, setIsJoining] = useState(false);

  const joinRoom = useCallback(
    async (meetingId: string) => {
      setIsJoining(true);
      try {
        const response = await roomApi.join(meetingId);
        dispatch(
          setMeetingInfo({
            meetingId: response.meetingId,
            sfuToken: response.sfuToken,
            sfuUrl: response.sfuUrl,
            role: response.role,
            participantCount: response.participantCount,
          })
        );
        navigate(`/room/${response.meetingId}`);
      } catch {
        // Error handled by axios interceptor
      } finally {
        setIsJoining(false);
      }
    },
    [dispatch, navigate]
  );

  const leaveRoom = useCallback(async () => {
    const meetingId = meeting.meetingId;
    if (!meetingId) return;

    try {
      await roomApi.leave(meetingId);
    } catch {
      // Best-effort — user is leaving anyway
    } finally {
      dispatch(resetMeeting());
      navigate("/dashboard");
      toast.success("You left the meeting.");
    }
  }, [meeting.meetingId, dispatch, navigate]);

  const closeRoom = useCallback(async () => {
    const meetingId = meeting.meetingId;
    if (!meetingId) return;

    try {
      await roomApi.close(meetingId);
      toast.success("Meeting ended for everyone.");
    } catch {
      // handled by interceptor
    } finally {
      dispatch(resetMeeting());
      // Host ends meeting → navigate to the AI summary page
      navigate(`/meeting/${meetingId}/summary`);
    }
  }, [meeting.meetingId, dispatch, navigate]);

  const onConnected = useCallback(() => {
    dispatch(setConnectionStatus("connected"));
  }, [dispatch]);

  const onDisconnected = useCallback(() => {
    dispatch(setConnectionStatus("disconnected"));
  }, [dispatch]);

  const onError = useCallback(
    (error: Error) => {
      console.error("LiveKit connection error:", error);
      dispatch(setConnectionStatus("error"));
      toast.error("Connection to media server failed.");
    },
    [dispatch]
  );

  return {
    meeting,
    isJoining,
    joinRoom,
    leaveRoom,
    closeRoom,
    onConnected,
    onDisconnected,
    onError,
  };
}