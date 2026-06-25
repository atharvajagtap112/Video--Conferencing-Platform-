package com.atharva.backend.ai.service;

public interface LocalWhisperService {
    String transcribe(String audioFilePath);
}