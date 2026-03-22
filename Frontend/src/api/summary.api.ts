import api from "./axios";
export const summaryApi = {
  status: async (meetingId: string) => (await api.get(`/api/meetings/${meetingId}/summary/status`)).data,
  get: async (meetingId: string) => (await api.get(`/api/meetings/${meetingId}/summary`)).data,
};