package com.atharva.backend.signaling.dto;

public enum SignalType {
    // WebRTC handshake (only needed for P2P fallback or custom SFU)
    OFFER,
    ANSWER,
    ICE_CANDIDATE,

    // Room lifecycle events
    USER_JOINED,
    USER_LEFT,

    // In-call features
    HAND_RAISED,
    HAND_LOWERED,
    CHAT_MESSAGE,
    SCREEN_SHARE_STARTED,
    SCREEN_SHARE_STOPPED,
    MUTE_REQUEST,       // Host asks someone to mute
    ROOM_CLOSED         // Broadcast: host ended the meeting
}