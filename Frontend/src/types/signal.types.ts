// Mirrors: com.atharva.backend.signaling.dto.SignalType
export enum SignalType {
  OFFER = "OFFER",
  ANSWER = "ANSWER",
  ICE_CANDIDATE = "ICE_CANDIDATE",
  USER_JOINED = "USER_JOINED",
  USER_LEFT = "USER_LEFT",
  HAND_RAISED = "HAND_RAISED",
  HAND_LOWERED = "HAND_LOWERED",
  CHAT_MESSAGE = "CHAT_MESSAGE",
  SCREEN_SHARE_STARTED = "SCREEN_SHARE_STARTED",
  SCREEN_SHARE_STOPPED = "SCREEN_SHARE_STOPPED",
  MUTE_REQUEST = "MUTE_REQUEST",
  ROOM_CLOSED = "ROOM_CLOSED",
}

// Mirrors: com.atharva.backend.signaling.dto.SignalMessage
export interface SignalMessage {
  type: SignalType;
  meetingId: string;
  senderUsername: string;
  targetUsername: string | null;
  payload: unknown;
}

export interface ChatMessage {
  id: string;
  senderUsername: string;
  text: string;
  timestamp: Date;
}  