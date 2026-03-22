import api from "./axios";

export interface MeetingHistoryItem {
  meetingId: string;
  title: string;
  role: "HOST" | "GUEST";
  roomStatus: string;
  joinedAt: string;
  leftAt: string | null;
  closedAt: string | null;
  summaryStatus: "NOT_AVAILABLE" | "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
}

export const meetingApi = {
  getHistory: async (): Promise<MeetingHistoryItem[]> => {
    const res = await api.get("/api/rooms/history");
    return res.data;
  },
};