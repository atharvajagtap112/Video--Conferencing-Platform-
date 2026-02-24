import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
import authReducer from "./auth.store";
import meetingReducer from "./meeting.store";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    meeting: meetingReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // ChatMessage contains Date objects
        ignoredPaths: ["meeting.chatMessages"],
        ignoredActions: ["meeting/addChatMessage"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;