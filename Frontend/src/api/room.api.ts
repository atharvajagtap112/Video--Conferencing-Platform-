import api from "./axios";
import type {
  CreateRoomRequest,
  RoomResponse,
  JoinRoomResponse,
} from "@/types/room.types";

export const roomApi = {
  create: async (data: CreateRoomRequest): Promise<RoomResponse> => {
    const response = await api.post<RoomResponse>("/api/rooms/create", data);
     console.log("API Response:", response.data);
    return response.data;
   
  },

  join: async (meetingId: string): Promise<JoinRoomResponse> => {
    const response = await api.post<JoinRoomResponse>(
      `/api/rooms/${meetingId}/join`
    );
    console.log("API Response:", response.data);
    return response.data;
  },

  leave: async (meetingId: string): Promise<void> => {
    await api.post(`/api/rooms/${meetingId}/leave`);
  },

  close: async (meetingId: string): Promise<void> => {
    await api.post(`/api/rooms/${meetingId}/close`);
  },
};