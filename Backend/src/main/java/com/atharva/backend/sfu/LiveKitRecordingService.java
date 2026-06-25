package com.atharva.backend.sfu;

public interface LiveKitRecordingService {
    void startRecording(String meetingId);
    String stopAndGetRecordingPath(String meetingId);
}