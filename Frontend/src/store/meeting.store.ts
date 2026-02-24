import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ChatMessage } from "@/types/signal.types";

type ConnectionStatus = "idle" | "connecting" | "connected" | "disconnected" | "error";

interface MeetingState {
  meetingId: string | null;
  sfuToken: string | null;
  sfuUrl: string | null;
  role: "HOST" | "CO_HOST" | "GUEST" | null;
  connectionStatus: ConnectionStatus;
  participantCount: number;
  isChatOpen: boolean;
  isParticipantListOpen: boolean;
  chatMessages: ChatMessage[];
  unreadChatCount: number;
  handRaisedUsers: string[];
}

const initialState: MeetingState = {
  meetingId: null,
  sfuToken: null,
  sfuUrl: null,
  role: null,
  connectionStatus: "idle",
  participantCount: 0,
  isChatOpen: false,
  isParticipantListOpen: false,
  chatMessages: [],
  unreadChatCount: 0,
  handRaisedUsers: [],
};

const meetingSlice = createSlice({
  name: "meeting",
  initialState,
  reducers: {
    setMeetingInfo(
      state,
      action: PayloadAction<{
        meetingId: string;
        sfuToken: string;
        sfuUrl: string;
        role: "HOST" | "CO_HOST" | "GUEST";
        participantCount: number;
      }>
    ) {
      state.meetingId = action.payload.meetingId;
      state.sfuToken = action.payload.sfuToken;
      state.sfuUrl = action.payload.sfuUrl;
      state.role = action.payload.role;
      state.participantCount = action.payload.participantCount;
      state.connectionStatus = "connecting";
    },
    setConnectionStatus(state, action: PayloadAction<ConnectionStatus>) {
      state.connectionStatus = action.payload;
    },
    setParticipantCount(state, action: PayloadAction<number>) {
      state.participantCount = action.payload;
    },
    toggleChat(state) {
      state.isChatOpen = !state.isChatOpen;
      if (state.isChatOpen) {
        state.unreadChatCount = 0;
        // Close participant list when chat opens
        state.isParticipantListOpen = false;
      }
    },
    toggleParticipantList(state) {
      state.isParticipantListOpen = !state.isParticipantListOpen;
      if (state.isParticipantListOpen) {
        state.isChatOpen = false;
      }
    },
    addChatMessage(state, action: PayloadAction<ChatMessage>) {
      state.chatMessages.push(action.payload);
      if (!state.isChatOpen) {
        state.unreadChatCount += 1;
      }
    },
    addHandRaised(state, action: PayloadAction<string>) {
      if (!state.handRaisedUsers.includes(action.payload)) {
        state.handRaisedUsers.push(action.payload);
      }
    },
    removeHandRaised(state, action: PayloadAction<string>) {
      state.handRaisedUsers = state.handRaisedUsers.filter(
        (u) => u !== action.payload
      );
    },
    resetMeeting() {
      return initialState;
    },
  },
});

export const {
  setMeetingInfo,
  setConnectionStatus,
  setParticipantCount,
  toggleChat,
  toggleParticipantList,
  addChatMessage,
  addHandRaised,
  removeHandRaised,
  resetMeeting,
} = meetingSlice.actions;

export default meetingSlice.reducer;