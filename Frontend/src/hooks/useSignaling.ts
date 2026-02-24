import { useEffect, useRef, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  addChatMessage,
  addHandRaised,
  removeHandRaised,
  resetMeeting,
} from "@/store/meeting.store";
import { SignalType, type SignalMessage, type ChatMessage } from "@/types/signal.types";

export function useSignaling() {
  const dispatch = useAppDispatch();
  const clientRef = useRef<Client | null>(null);
  const { user } = useAppSelector((state) => state.auth);
  const { meetingId } = useAppSelector((state) => state.meeting);

  // Connect to STOMP WebSocket when meeting is active
  useEffect(() => {
    if (!meetingId || !user) return;

    const wsUrl = import.meta.env.VITE_WS_URL || "http://localhost:8080/ws";

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: {},
      // SockJS doesn't support STOMP connect headers natively,
      // so we pass them as custom headers during the CONNECT frame
      onConnect: () => {
        // Subscribe to the room topic
        client.subscribe(`/topic/room-${meetingId}`, (message) => {
          try {
            const signal = JSON.parse(message.body) as SignalMessage;
            handleSignal(signal);
          } catch (e) {
            console.error("Failed to parse signal message:", e);
          }
        });

        // Subscribe to private queue for direct messages
        client.subscribe("/user/queue/signal", (message) => {
          try {
            const signal = JSON.parse(message.body) as SignalMessage;
            handleSignal(signal);
          } catch (e) {
            console.error("Failed to parse private signal:", e);
          }
        });
      },
      onStompError: (frame) => {
        console.error("STOMP error:", frame.headers["message"]);
        toast.error("Signaling connection error.");
      },
      onWebSocketClose: () => {
        console.warn("WebSocket connection closed.");
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    // Inject custom STOMP headers (username + meetingId)
    // These are read by WebSocketEventListener on the backend
    client.beforeConnect = async () => {
      client.connectHeaders = {
        username: user.username,
        meetingId: meetingId,
      };
    };

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId, user?.username]);

  const handleSignal = useCallback(
    (signal: SignalMessage) => {
      // Ignore our own broadcasts
      if (signal.senderUsername === user?.username) return;

      switch (signal.type) {
        case SignalType.USER_JOINED:
          toast(`${signal.senderUsername} joined the meeting`, {
            icon: "👋",
            duration: 3000,
          });
          break;

        case SignalType.USER_LEFT:
          toast(`${signal.senderUsername} left the meeting`, {
            icon: "👋",
            duration: 3000,
          });
          break;

        case SignalType.CHAT_MESSAGE: {
          const chatMsg: ChatMessage = {
            id: `${Date.now()}-${signal.senderUsername}`,
            senderUsername: signal.senderUsername,
            text: signal.payload as string,
            timestamp: new Date(),
          };
          dispatch(addChatMessage(chatMsg));
          break;
        }

        case SignalType.HAND_RAISED:
          dispatch(addHandRaised(signal.senderUsername));
          toast(`${signal.senderUsername} raised their hand ✋`, {
            duration: 4000,
          });
          break;

        case SignalType.HAND_LOWERED:
          dispatch(removeHandRaised(signal.senderUsername));
          break;

        case SignalType.ROOM_CLOSED:
          toast.error("The host has ended the meeting.");
          dispatch(resetMeeting());
          break;

        case SignalType.MUTE_REQUEST:
          toast("The host is asking you to mute your microphone.", {
            icon: "🔇",
            duration: 5000,
          });
          break;

        default:
          break;
      }
    },
    [dispatch, user?.username]
  );

  const sendSignal = useCallback(
    (
      type: SignalType,
      payload?: unknown,
      targetUsername?: string
    ) => {
      if (!clientRef.current?.connected || !meetingId || !user) return;

      const message: SignalMessage = {
        type,
        meetingId,
        senderUsername: user.username,
        targetUsername: targetUsername ?? null,
        payload: payload ?? null,
      };

      clientRef.current.publish({
        destination: "/app/signal",
        body: JSON.stringify(message),
      });
    },
    [meetingId, user]
  );

  const sendChatMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;

      // Add locally immediately for instant feedback
      const localMsg: ChatMessage = {
        id: `${Date.now()}-${user?.username}`,
        senderUsername: user?.username ?? "You",
        text: text.trim(),
        timestamp: new Date(),
      };
      dispatch(addChatMessage(localMsg));

      // Broadcast to room
      sendSignal(SignalType.CHAT_MESSAGE, text.trim());
    },
    [dispatch, sendSignal, user?.username]
  );

  const raiseHand = useCallback(() => {
    sendSignal(SignalType.HAND_RAISED);
    if (user) dispatch(addHandRaised(user.username));
  }, [sendSignal, dispatch, user]);

  const lowerHand = useCallback(() => {
    sendSignal(SignalType.HAND_LOWERED);
    if (user) dispatch(removeHandRaised(user.username));
  }, [sendSignal, dispatch, user]);

  return {
    sendSignal,
    sendChatMessage,
    raiseHand,
    lowerHand,
  };
}