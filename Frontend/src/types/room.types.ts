// Mirrors: com.atharva.backend.room.dto.CreateRoomRequest
export interface CreateRoomRequest {
  title: string;
  maxParticipants: number;
}

// Mirrors: com.atharva.backend.room.dto.RoomResponse
export interface RoomResponse {
  meetingId: string;
  title: string;
  status: "ACTIVE" | "EXPIRED" | "CLOSED";
  maxParticipants: number;
  expiresAt: string;
}

// Mirrors: com.atharva.backend.room.dto.JoinRoomResponse
export interface JoinRoomResponse {
  meetingId: string;
  sfuToken: string;
  sfuUrl: string;
  role: "HOST" | "CO_HOST" | "GUEST";
  participantCount: number;
}