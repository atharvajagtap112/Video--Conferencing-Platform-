<div align="center">

# 🎥 MeetSpace — Video Conferencing Platform

**A production-grade Google Meet / Zoom alternative built from scratch**

Spring Boot · React · LiveKit · WebRTC · MySQL · WebSockets

[![Java](https://img.shields.io/badge/Java-21-orange?style=for-the-badge&logo=openjdk)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2-6DB33F?style=for-the-badge&logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![LiveKit](https://img.shields.io/badge/LiveKit-SFU-FF6B6B?style=for-the-badge)](https://livekit.io/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Why SFU? Architecture Deep Dive](#-why-sfu-architecture-deep-dive)
- [System Architecture](#-system-architecture)
- [Data Flow — Step by Step](#-data-flow--step-by-step)
- [Dual Token Authentication](#-dual-token-authentication)
- [Dual WebSocket Connections](#-dual-websocket-connections)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Backend API Reference](#-backend-api-reference)
- [Frontend Component Architecture](#-frontend-component-architecture)
- [Database Schema](#-database-schema)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Features](#-features)
- [Screenshots](#-screenshots)

---

## 🌟 Overview

MeetSpace is a **full-stack video conferencing platform** that replicates the core functionality of Google Meet and Zoom. It supports real-time video/audio streaming, screen sharing, in-call chat, hand raising, participant management, and role-based controls — all built with a clear separation between business logic and media routing.

The key architectural decision is the use of a **Selective Forwarding Unit (SFU)** via LiveKit, which means the Spring Boot server **never touches video/audio data**. It only handles authentication, room management, and signaling.

---

## 🧠 Why SFU? Architecture Deep Dive

### The Problem with Peer-to-Peer (P2P)

In a naive WebRTC implementation, every participant sends their video to every other participant directly:

```
                    P2P Mesh (4 participants)
           ┌──────────────────────────────────┐
           │                                  │
      User A ◄──────► User B                  │
        ▲ ▲            ▲ ▲                    │
        │ │            │ │                    │
        │ └────────────┘ │                    │
        │                │                    │
        ▼                ▼                    │
      User C ◄──────► User D                  │
           │                                  │
           └──────────────────────────────────┘

     Connections per user: N-1 = 3
     Total connections: N(N-1)/2 = 6
     Upload bandwidth per user: 3x (sends to everyone)
```

**Problems:**
- With 10 users → 45 connections, each user uploads 9 streams
- CPU melts. Bandwidth explodes. Mobile devices catch fire 🔥
- No server-side recording possible

### The SFU Solution

A **Selective Forwarding Unit** sits in the middle. Each user sends **one** upload stream to the SFU, and the SFU **selectively forwards** it to everyone else:

```
                        SFU Architecture
                    ┌─────────────────────┐
                    │                     │
     User A ──────►│                     │──────► User B
     (1 upload)    │    LiveKit SFU      │  (receives A,C,D)
                    │                     │
     User B ──────►│  • Receives 1 stream│──────► User A
     (1 upload)    │    from each user   │  (receives B,C,D)
                    │                     │
     User C ──────►│  • Forwards to all  │──────► User D
     (1 upload)    │    other users      │  (receives A,B,C)
                    │                     │
     User D ──────►│  • No transcoding   │──────► User C
     (1 upload)    │  • No mixing        │  (receives A,B,D)
                    │                     │
                    └─────────────────────┘

     Connections per user: 1 (to SFU)
     Upload bandwidth per user: 1x (always)
     SFU handles: routing, bandwidth estimation, simulcast
```

### Why LiveKit specifically?

| Feature | LiveKit | Jitsi | Mediasoup |
|---------|---------|-------|-----------|
| Language | Go | Java | C++/Node |
| Simulcast | ✅ Built-in | ✅ | ✅ |
| Scalability | Horizontal | Vertical | Single node |
| Cloud offering | ✅ LiveKit Cloud | ❌ Self-host | ❌ Self-host |
| JWT Auth | ✅ Native | Custom | Custom |
| Server SDK (Java) | ✅ Official | ❌ | ❌ |
| Adaptive streaming | ✅ Dynacast | ❌ | Manual |

LiveKit gives us **simulcast** (each client sends multiple quality layers — the SFU picks the right one per viewer based on their bandwidth) and **dynacast** (stops sending video layers nobody is watching).

### SFU vs MCU vs Mesh

```
┌─────────────┬────────────────┬──────────────────┬─────────────────────┐
│             │ Mesh (P2P)     │ SFU              │ MCU                 │
├─────────────┼────────────────┼──────────────────┼─────────────────────┤
│ Upload      │ N-1 streams    │ 1 stream         │ 1 stream            │
│ Download    │ N-1 streams    │ N-1 streams      │ 1 mixed stream      │
│ Server CPU  │ None           │ Low (forwarding) │ Very High (mixing)  │
│ Latency     │ Lowest         │ Low              │ Higher              │
│ Scale       │ ~4 users       │ ~500 users       │ ~50 users           │
│ Complexity  │ Low            │ Medium           │ High                │
│ Cost        │ Free           │ Medium           │ Expensive           │
│ Used by     │ 1:1 calls      │ Google Meet,Zoom │ Legacy systems      │
└─────────────┴────────────────┴──────────────────┴─────────────────────┘

This project uses SFU → Best balance of quality, scale, and cost.
```

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                               │
│                                                                             │
│  ┌──────────────┐  ┌──────────────────┐  ┌────────────────────────────┐    │
│  │  React 19    │  │  Redux Toolkit   │  │  LiveKit Client SDK        │    │
│  │  + Router    │  │  (Auth + Meeting │  │  (@livekit/components-react)│    │
│  │  + Shadcn/ui │  │   state)         │  │                            │    │
│  └──────┬───────┘  └────────┬─────────┘  └────────────┬───────────────┘    │
│         │                   │                          │                    │
│         │    Axios (REST)   │    STOMP/SockJS          │  WebRTC            │
│         ▼                   ▼                          ▼                    │
└─────────┼───────────────────┼──────────────────────────┼────────────────────┘
          │                   │                          │
          │ HTTP :8080        │ WS :8080/ws              │ WSS (LiveKit Cloud)
          ▼                   ▼                          ▼
┌─────────────────────────────────────────┐  ┌────────────────────────────────┐
│         SPRING BOOT BACKEND             │  │       LIVEKIT SFU SERVER       │
│                                         │  │                                │
│  ┌─────────────┐  ┌──────────────────┐  │  │  ┌────────────────────────┐   │
│  │ Auth        │  │ Room             │  │  │  │  Media Router          │   │
│  │ Controller  │  │ Controller       │  │  │  │  ┌──────────────────┐  │   │
│  │             │  │                  │  │  │  │  │ Video: VP8/VP9   │  │   │
│  │ POST /login │  │ POST /create     │  │  │  │  │ Audio: Opus      │  │   │
│  │ POST /signup│  │ POST /{id}/join  │  │  │  │  │ Simulcast layers │  │   │
│  │             │  │ POST /{id}/leave │  │  │  │  └──────────────────┘  │   │
│  └──────┬──────┘  │ POST /{id}/close │  │  │  │                        │   │
│         │         └────────┬─────────┘  │  │  │  Bandwidth Estimation  │   │
│         │                  │            │  │  │  Adaptive Streaming     │   │
│  ┌──────▼──────────────────▼─────────┐  │  │  │  Dynacast              │   │
│  │         Service Layer             │  │  │  └────────────────────────┘   │
│  │                                   │  │  │                                │
│  │  AuthService     RoomService      │  │  │  Validates LiveKit JWT tokens  │
│  │  JwtService      LiveKitService   │  │  │  Routes video/audio packets    │
│  │                                   │  │  │  Never sees business logic     │
│  └──────────────┬────────────────────┘  │  │                                │
│                 │                        │  └────────────────────────────────┘
│  ┌──────────────▼────────────────────┐  │
│  │         Data Layer                │  │
│  │                                   │  │
│  │  UserRepository                   │  │
│  │  MeetingRoomRepository            │  │
│  │  ParticipantRepository            │  │
│  └──────────────┬────────────────────┘  │
│                 │                        │
│  ┌──────────────▼────────────────────┐  │
│  │   Signaling (WebSocket/STOMP)     │  │
│  │                                   │  │
│  │  SignalingController              │  │
│  │  WebSocketEventListener           │  │
│  │  /topic/room-{meetingId}          │  │
│  │  /app/signal                      │  │
│  └───────────────────────────────────┘  │
└─────────────────┬───────────────────────┘
                  │
                  ▼
       ┌─────────────────────┐
       │     MySQL 8.x       │
       │                     │
       │  users              │
       │  meeting_rooms      │
       │  participants       │
       └─────────────────────┘
```

---

## 🔄 Data Flow — Step by Step

### Complete User Journey

```
 ┌─────────┐       ┌──────────────┐       ┌──────────────┐       ┌─────────────┐
 │  SIGNUP  │──────►│   CREATE     │──────►│    JOIN      │──────►│  IN-MEETING  │
 │  /LOGIN  │       │   ROOM       │       │    ROOM      │       │  EXPERIENCE  │
 └─────────┘       └──────────────┘       └──────────────┘       └─────────────┘
      │                   │                      │                      │
      ▼                   ▼                      ▼                      ▼

   Step 1              Step 2                 Step 3               Steps 4-6
   Get App JWT         Get meeting_id         Get SFU token        Media + Signaling
```

### Step 1: Authentication

```
  React                          Spring Boot                    MySQL
    │                                │                            │
    │  POST /api/auth/signup         │                            │
    │  {username, email,             │                            │
    │   password, displayName}       │                            │
    │───────────────────────────────►│                            │
    │                                │  INSERT INTO users         │
    │                                │───────────────────────────►│
    │                                │                            │
    │                                │  Generate APP JWT          │
    │                                │  (userId + username)       │
    │                                │                            │
    │  {token, username,             │                            │
    │   displayName}                 │                            │
    │◄───────────────────────────────│                            │
    │                                │                            │
    │  localStorage.setItem(         │                            │
    │    "token", jwt)               │                            ��
    │  Axios interceptor auto-       │                            │
    │  attaches to all requests      │                            │
```

### Step 2: Create Room

```
  React                          Spring Boot                    MySQL
    │                                │                            │
    │  POST /api/rooms/create        │                            │
    │  Header: Bearer <APP_JWT>      │                            │
    │  {title, maxParticipants}      │                            │
    │───────────────────────────────►│                            │
    │                                │  JwtFilter validates token │
    │                                │  Generate meeting_id       │
    │                                │  "abc-defg-hij" format     │
    │                                │                            │
    │                                │  INSERT INTO meeting_rooms │
    │                                │───────────────────────────►│
    │                                │                            │
    │  {meetingId: "abc-defg-hij",   │                            │
    │   title, status: "ACTIVE",     │                            │
    │   maxParticipants, expiresAt}  │                            │
    │◄─────────���─────────────────────│                            │
```

### Step 3: Join Room (The Critical Step)

```
  React                     Spring Boot                LiveKit            MySQL
    │                           │                         │                 │
    │  POST /rooms/{id}/join    │                         │                 │
    │  Bearer <APP_JWT>         │                         │                 │
    │──────────────────────────►│                         │                 │
    │                           │                         │                 │
    │                           │  Validate: room ACTIVE? │                 │
    │                           │  Not expired? Not full?  │                 │
    │                           │─────────────────────────────────────────►│
    │                           │                         │                 │
    │                           │  INSERT participant     │                 │
    │                           │─────────────────────────────────────────►│
    │                           │                         │                 │
    │                           │  LiveKitService         │                 │
    │                           │  .generateToken()       │                 │
    │                           │                         │                 │
    │                           │  Mint LIVEKIT JWT ──────┤                 │
    │                           │  grants: {              │                 │
    │                           │    room: "abc-defg-hij" │                 │
    │                           │    canPublish: true     │                 │
    │                           │    canSubscribe: true   │                 │
    │                           │    roomAdmin: true/false│                 │
    │                           │  }                      │                 │
    │                           │                         │                 │
    │  {sfuToken, sfuUrl,       │                         │                 │
    │   role, participantCount} │                         │                 │
    │◄──────────────────────────│                         │                 │
    │                           │                         │                 │
    │  Redux: dispatch(         │                         │                 │
    │    setMeetingInfo(...))   │                         │                 │
    │  Navigate to /room/{id}  │                         │                 │
```

### Step 4: Connect to SFU (Media)

```
  React (LiveKit SDK)                              LiveKit SFU
    │                                                  │
    │  <LiveKitRoom                                    │
    │    token={sfuToken}                              │
    │    serverUrl="wss://..."                         │
    │    connect={true} />                             │
    │                                                  │
    │  WSS Connect ───────────────────────────────────►│
    │                                                  │  Validate LiveKit JWT
    │                                                  │  Check room grants
    │  Connection Established ◄────────────────────────│
    │                                                  │
    │  Publish Camera Track ──────────────────────────►│
    │  (VP8, 3 simulcast layers:                       │  Forward to
    │   high=720p, med=360p, low=180p)                 │  all subscribers
    │                                                  │
    │  Publish Mic Track ─────────────────────────────►│
    │  (Opus, 48kHz)                                   │  Forward to
    │                                                  │  all subscribers
    │                                                  │
    │  Receive Remote Tracks ◄─────────────────────────│
    │  (SFU selects quality layer                      │
    │   based on viewer's bandwidth)                   │
```

### Step 5: Signaling (Non-Media Events)

```
  React (STOMP Client)                    Spring Boot                Other Clients
    │                                        │                          │
    │  SockJS Connect to /ws                 │                          │
    │  Headers: {username, meetingId}         │                          │
    │───────────────────────────────────────►│                          │
    │                                        │  WebSocketEventListener  │
    │                                        │  stores session info     │
    │                                        │                          │
    │                                        │  Broadcast USER_JOINED   │
    │                                        │  to /topic/room-{id}     │
    │                                        │─────────────────────────►│
    │                                        │                          │
    │  Send: /app/signal                     │                          │
    │  {type: "CHAT_MESSAGE",                │                          │
    │   payload: "Hello!"}                   │                          │
    │───────────────────────────────────────►│                          │
    │                                        │  Broadcast to            │
    │                                        │  /topic/room-{id}        │
    │                                        │─────────────────────────►│
    │                                        │                          │
    │  Send: /app/signal                     │                          │
    │  {type: "HAND_RAISED"}                 │                          │
    │───────────────────────────────────────►│                          │
    │                                        │  Broadcast               │
    │                                        │─────────────────────────►│
```

### Step 6: Disconnect

```
  React                          Spring Boot                    MySQL
    │                                │                            │
    │  Close WebSocket               │                            │
    │──────────────────────────────►│                            │
    │                                │  SessionDisconnectEvent    │
    │                                │                            │
    │                                │  Broadcast USER_LEFT       │
    │                                │  to /topic/room-{id}       │
    │                                │                            │
    │                                │  UPDATE participant        │
    │                                │  SET left_at = NOW()       │
    │                                │───────────────────────────►│
    │                                │                            │
    │                                │  Decrement room            │
    │                                │  currentParticipantCount   │
    │                                │───────────────────────────►│
    │                                │                            │
    │  POST /rooms/{id}/leave        │                            │
    │  (best-effort cleanup)         │                            │
    │───────────────────────────────►│                            │
```

---

## 🔐 Dual Token Authentication

This system uses **two completely separate JWT tokens** for different purposes:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│   APP JWT (from JwtService)              SFU JWT (from LiveKitService)   │
│   ─────────────────────────              ────────────────────────────    │
│                                                                          │
│   Issuer: Your Spring Boot app           Issuer: LiveKit API Key         │
│   Secret: app.jwt.secret                 Secret: livekit.api.secret      │
│   Purpose: Authenticate user             Purpose: Authorize media access │
│            against YOUR API                       on LiveKit server       │
│                                                                          │
│   Contains:                              Contains:                       │
│   • userId (subject)                     • identity (username)           │
│   • username (claim)                     • room grants:                  │
│   • expiration                           │  - roomJoin: true             │
│                                          │  - room: "abc-defg-hij"       │
│   Used in:                               │  - canPublish: true           │
│   • Authorization: Bearer <token>        │  - canSubscribe: true         │
│   • Every REST API call                  │  - roomAdmin: true/false      │
│   • Axios interceptor auto-attaches      │                               │
│                                          │ Used in:                       │
│   Validated by:                          │ • LiveKitRoom component        │
│   • JwtAuthenticationFilter              │ • WSS connection to SFU        │
│   • On every request to /api/**          │                               │
│                                          │ Validated by:                  │
│   Lifetime: 1 hour                       │ • LiveKit server itself        │
│   (app.jwt.expiration-ms)                │                               │
│                                          │ Lifetime: 6 hours              │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🔌 Dual WebSocket Connections

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         BROWSER (2 WebSocket connections)               │
│                                                                         │
│  ┌─────────────────────────────┐  ┌──────────────────────────────────┐ │
│  │  STOMP WebSocket            │  │  LiveKit WebSocket               │ │
│  │  ─────────────────          │  │  ──────────────────              │ │
│  │                             │  │                                  │ │
│  │  URL: ws://localhost:8080/ws│  │  URL: wss://livekit-cloud/...   │ │
│  │  Protocol: STOMP over SockJS│  │  Protocol: LiveKit (WebRTC)     │ │
│  │                             │  │                                  │ │
│  │  Carries:                   │  │  Carries:                        │ │
│  │  • Chat messages            │  │  • Video streams (VP8)           │ │
│  │  • Hand raise/lower         │  │  • Audio streams (Opus)          │ │
│  │  • User joined/left events  │  │  • Screen share streams          │ │
│  │  • Screen share signals     │  │  • ICE candidates                │ │
│  │  • Mute requests            │  │  • SDP negotiation               │ │
│  │  • Room closed broadcast    │  │  • Bandwidth estimation          │ │
│  │                             │  │  • Simulcast layer switching     │ │
│  │  Connects to:               │  │                                  │ │
│  │  YOUR Spring Boot server    │  │  Connects to:                    │ │
│  │                             │  │  LiveKit's media server          │ │
│  │  ~1 KB/s traffic            │  │                                  │ │
│  │                             │  │  ~500 KB/s - 5 MB/s traffic     │ │
│  └─────────────────────────────┘  └──────────────────────────────────┘ │
│                                                                         │
│  WHY SEPARATE?                                                          │
│  • Spring Boot never handles video → no CPU/bandwidth bottleneck       │
│  • LiveKit never sees business logic → clean separation of concerns    │
│  • Each can scale independently                                         │
│  • Spring Boot: horizontal scale with Redis pub/sub                    │
│  • LiveKit: horizontal scale with their routing infrastructure         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

### Backend

| Technology | Purpose |
|------------|---------|
| **Java 21** | Language runtime |
| **Spring Boot 3.2** | Application framework |
| **Spring Security** | JWT authentication, filter chain |
| **Spring Data JPA** | ORM, repository pattern |
| **Spring WebSocket** | STOMP messaging for signaling |
| **Hibernate 6** | JPA implementation |
| **MySQL 8** | Persistent storage |
| **LiveKit Java SDK** | SFU token generation |
| **jjwt 0.12** | JWT creation and validation |
| **Lombok** | Boilerplate reduction |
| **Spring Retry** | Deadlock handling with exponential backoff |

### Frontend

| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework |
| **TypeScript 5.7** | Type safety |
| **Vite 6** | Build tool, dev server with HMR |
| **Redux Toolkit** | Global state (auth + meeting) |
| **React Router 7** | Client-side routing |
| **@livekit/components-react** | Video grid, participant tiles |
| **livekit-client** | LiveKit WebRTC SDK |
| **@stomp/stompjs** | STOMP WebSocket client |
| **sockjs-client** | WebSocket fallback |
| **Axios** | HTTP client with JWT interceptor |
| **Tailwind CSS 3.4** | Utility-first styling |
| **Shadcn/ui** | Radix-based component library |
| **Framer Motion** | Animations and page transitions |
| **Lucide React** | Icon library |
| **React Hot Toast** | Notification system |

---

## 📁 Project Structure

```
Video--Conferencing-Platform-/
│
├── Backend/                          # Spring Boot (Git submodule)
│   └── src/main/java/com/atharva/backend/
│       ├── auth/
│       │   ├── AuthController.java        # POST /signup, /login
│       │   ├── AuthService.java           # User registration, login logic
│       │   ├── JwtService.java            # APP JWT generation & validation
│       │   ├── JwtAuthenticationFilter.java # OncePerRequestFilter
│       │   ├── dto/
│       │   │   ├── SignupRequest.java
│       │   │   ├── LoginRequest.java
│       │   │   └── AuthResponse.java
│       │   └── entity/
│       │       └── User.java              # JPA entity
│       ├── room/
│       │   ├── RoomController.java        # /create, /join, /leave, /close
│       │   ├── RoomService.java           # Business logic + LiveKit integration
│       │   ├── dto/
│       │   │   ├── CreateRoomRequest.java
│       │   │   ├── JoinRoomResponse.java  # Contains sfuToken + sfuUrl
│       │   │   └── RoomResponse.java
│       │   └── entity/
│       │       ├── MeetingRoom.java       # rooms table
│       │       ├── Participant.java       # participants table
│       │       ├── ParticipantRole.java   # HOST, CO_HOST, GUEST
│       │       └── RoomStatus.java        # ACTIVE, EXPIRED, CLOSED
│       ├── sfu/
│       │   ├── LiveKitService.java        # SFU JWT token minting
│       │   └── dto/
│       │       └── SfuTokenResponse.java
│       ├── signaling/
│       │   ├── SignalingController.java    # STOMP message routing
│       │   ├── WebSocketEventListener.java # Connect/disconnect handling
│       │   └── dto/
│       │       ├── SignalMessage.java
│       │       └── SignalType.java        # 11 event types
│       ├── config/
│       │   ├── SecurityConfig.java        # Filter chain, CORS, stateless
│       │   └── WebSocketConfig.java       # STOMP broker config
│       └── repository/
│           ├── UserRepository.java
│           ├── MeetingRoomRepository.java  # Includes pessimistic locking
│           └── ParticipantRepository.java
│
├── Frontend/                          # React + Vite
│   ├── src/
│   │   ├── main.tsx                       # App entry: Redux + Router + Toaster
│   │   ├── App.tsx                        # Route definitions + AnimatePresence
│   │   ├── index.css                      # Tailwind + CSS variables + LiveKit overrides
│   │   │
│   │   ├── api/                           # API Layer
│   │   │   ├── axios.ts                   # Axios instance + JWT interceptor
│   │   │   ├── auth.api.ts               # signup(), login()
│   │   │   └── room.api.ts               # create(), join(), leave(), close()
│   │   │
│   │   ├── types/                         # TypeScript types (mirror Spring DTOs)
│   │   │   ├── auth.types.ts
│   │   │   ├── room.types.ts
│   │   │   └── signal.types.ts
│   │   │
│   │   ├── store/                         # Redux Toolkit
│   │   │   ├── index.ts                   # Store config + typed hooks
│   │   │   ├── auth.store.ts             # User + token + localStorage hydration
│   │   │   └── meeting.store.ts          # SFU token, chat, hand raise, status
│   │   │
│   │   ├── hooks/                         # Custom React Hooks
│   │   │   ├── useAuth.ts                # login/signup/logout actions
│   │   │   ├── useLiveKit.ts             # joinRoom/leaveRoom + SFU callbacks
│   │   │   └── useSignaling.ts           # STOMP WebSocket + chat/hand raise
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                        # Shadcn/ui primitives
│   │   │   │   ├── button.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── avatar.tsx
│   │   │   │   ├── label.tsx
│   │   │   │   ├── separator.tsx
│   │   │   │   └── tooltip.tsx
│   │   │   │
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.tsx             # Top nav with auth state
│   │   │   │   └── PageTransition.tsx     # Framer Motion wrapper
│   │   │   │
│   │   │   ├── auth/
│   │   │   │   ├── AuthGuard.tsx          # Protected route wrapper
│   │   │   │   ├── LoginForm.tsx          # Username + password
│   │   │   │   └── SignupForm.tsx         # Full registration form
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── CreateRoomDialog.tsx   # Create + auto-join flow
│   │   │   │   ├── JoinRoomDialog.tsx     # Meeting ID input
│   │   │   │   └── RoomCard.tsx           # Room display card
│   │   │   │
│   │   │   └── meeting/
│   │   │       ├── VideoStage.tsx         # LiveKitRoom provider wrapper
│   │   │       ├── ParticipantGrid.tsx    # Dynamic NxN video grid
│   │   │       ├── ControlBar.tsx         # Mic/Cam/Screen/Hand/Leave
│   │   │       ├── ChatPanel.tsx          # Slide-out right drawer
│   │   │       ├── ParticipantList.tsx    # People panel
│   │   │       └── ActiveSpeakerOverlay.tsx # Glow border on speaker
│   │   │
│   │   └── pages/
│   │       ├── Landing.tsx                # Hero + features + CTA
│   │       ├── Login.tsx
│   │       ├── Signup.tsx
│   │       ├── Dashboard.tsx              # Create/Join/Quick-join
│   │       └── Room.tsx                   # Meeting page orchestrator
│   │
│   ├── tailwind.config.ts
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
└── README.md
```

---

## 📡 Backend API Reference

### Authentication (Public)

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| `POST` | `/api/auth/signup` | `{username, email, password, displayName}` | `{token, username, displayName}` |
| `POST` | `/api/auth/login` | `{username, password}` | `{token, username, displayName}` |

### Room Management (Requires `Bearer <APP_JWT>`)

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| `POST` | `/api/rooms/create` | `{title, maxParticipants}` | `{meetingId, title, status, maxParticipants, expiresAt}` |
| `POST` | `/api/rooms/{meetingId}/join` | — | `{meetingId, sfuToken, sfuUrl, role, participantCount}` |
| `POST` | `/api/rooms/{meetingId}/leave` | — | `200 OK` |
| `POST` | `/api/rooms/{meetingId}/close` | — | `200 OK` (host only) |

### WebSocket Signaling

| Direction | Destination | Payload |
|-----------|-------------|---------|
| Client → Server | `/app/signal` | `SignalMessage` |
| Server → Client | `/topic/room-{meetingId}` | `SignalMessage` (broadcast) |
| Server → Client | `/user/queue/signal` | `SignalMessage` (private) |

### Signal Types

```
USER_JOINED          — Broadcast when user connects via WebSocket
USER_LEFT            — Broadcast on WebSocket disconnect
CHAT_MESSAGE         — In-call text message (payload = string)
HAND_RAISED          — User raised their hand
HAND_LOWERED         — User lowered their hand
SCREEN_SHARE_STARTED — Screen sharing began
SCREEN_SHARE_STOPPED — Screen sharing ended
MUTE_REQUEST         — Host asks participant to mute
ROOM_CLOSED          — Host ended the meeting for everyone
```

---

## ⚛️ Frontend Component Architecture

```
App.tsx
├── AnimatePresence (page transitions)
│
├── / ─────────────────► Landing.tsx
│                         ├── Navbar
│                         ├── Hero section
│                         ├── Features grid
│                         └── CTA section
│
├── /login ────────────► Login.tsx
│                         ├── Navbar
│                         └── LoginForm
│                              └── useAuth().login()
│                                   └── POST /api/auth/login
│                                        └── Redux: loginSuccess()
│                                             └── localStorage.setItem("token")
│
├── /signup ───────────► Signup.tsx
│                         ├── Navbar
│                         └── SignupForm
│                              └── useAuth().signup()
│
├── /dashboard ────────► Dashboard.tsx (AuthGuard)
│                         ├── Navbar
│                         ├── CreateRoomDialog
│                         │    └── roomApi.create() → wait → useLiveKit.joinRoom()
│                         ├── JoinRoomDialog
│                         │    └── useLiveKit.joinRoom()
│                         └── Quick Join input
│
└── /room/:meetingId ──► Room.tsx (AuthGuard)
                          │
                          ├── [no token] → Loading spinner
                          ├── [error]    → Error + retry UI
                          ├── [disconnected] → Rejoin UI
                          │
                          └── [has token] → VideoStage.tsx
                                            │
                                            ├── <LiveKitRoom> provider
                                            │    ├── token={sfuToken}
                                            │    ├── serverUrl={sfuUrl}
                                            │    ├── onConnected → Redux
                                            │    └── onDisconnected → Redux
                                            │
                                            ├── <RoomAudioRenderer />
                                            │
                                            ├── Layout: flex row
                                            │    │
                                            │    ├── Main area (flex-1)
                                            │    │    ├── ParticipantGrid
                                            │    │    │    ├── useTracks()
                                            │    │    │    ├── Dynamic grid (1→16+)
                                            │    │    │    ├── <ParticipantTile>
                                            │    │    │    ├── ActiveSpeakerOverlay
                                            │    │    │    ├── Hand raised badge
                                            │    │    │    └── Name badge
                                            │    │    │         (local = mirrored)
                                            │    │    │
                                            │    │    └── ControlBar
                                            │    │         ├── 🎤 Mic toggle
                                            │    │         ├── 📹 Camera toggle
                                            │    │         ├── 🖥️ Screen share
                                            │    │         ├── ✋ Hand raise
                                            │    │         ├── 📞 Leave/End
                                            │    │         ├── 💬 Chat toggle
                                            │    │         └── 👥 People toggle
                                            │    │
                                            │    ├── ChatPanel (right drawer)
                                            │    │    ├── useSignaling().sendChatMessage()
                                            │    │    ├── Messages from Redux store
                                            │    │    └── Auto-scroll + timestamps
                                            │    │
                                            │    └── ParticipantList (right drawer)
                                            │         ├── useParticipants()
                                            │         ├── Mic/Cam status icons
                                            │         └── Hand raised indicator
                                            │
                                            └── useSignaling() hook
                                                 ├── STOMP connect to /ws
                                                 ├── Subscribe /topic/room-{id}
                                                 ├── Handle: USER_JOINED → toast
                                                 ├── Handle: USER_LEFT → toast
                                                 ├── Handle: CHAT_MESSAGE → Redux
                                                 ├── Handle: HAND_RAISED → Redux
                                                 ├── Handle: ROOM_CLOSED → redirect
                                                 └── Handle: MUTE_REQUEST → toast
```

---

## 🗄 Database Schema

```sql
┌─────────────────────────────────┐
│            users                │
├─────────────────────────────────┤
│ id            BIGINT PK AUTO    │
│ username      VARCHAR(50) UNIQUE│
│ email         VARCHAR UNIQUE    │
│ password_hash VARCHAR           │
│ display_name  VARCHAR(100)      │
│ created_at    DATETIME          │
└──────────────┬──────────────────┘
               │ 1
               │
               │ N
┌──────────────▼──────────────────┐          ┌─────────────────────────────┐
│        meeting_rooms            │          │       participants          │
├─────────────────────────────────┤          ├─────────────────────────────┤
│ id            BIGINT PK AUTO    │ 1      N │ id             BIGINT PK   │
│ meeting_id    VARCHAR(36) UNIQUE│◄─────────│ meeting_room_id BIGINT FK  │
│ title         VARCHAR(150)      │          │ user_id         BIGINT FK  │
│ host_user_id  BIGINT FK ────────┤          │ role    ENUM(HOST,CO_HOST, │
│ status  ENUM(ACTIVE,EXPIRED,    │          │               GUEST)       │
│              CLOSED)            │          │ joined_at       DATETIME   │
│ max_participants INT            │          │ left_at         DATETIME   │
│ current_participant_count INT   │          │ session_id      VARCHAR    │
│ expires_at    DATETIME          │          │                            │
│ created_at    DATETIME          │          │ UNIQUE(meeting_room_id,    │
│ closed_at     DATETIME          │          │        user_id, joined_at) │
└─────────────────────────────────┘          └─────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Java 21** (OpenJDK or Oracle)
- **Node.js 20+** and npm
- **MySQL 8.x** running locally
- **LiveKit Cloud account** ([livekit.io](https://livekit.io)) or self-hosted LiveKit server

### 1. Clone the repository

```bash
git clone https://github.com/atharvajagtap112/Video--Conferencing-Platform-.git
cd Video--Conferencing-Platform-
```

### 2. Setup the Backend

```bash
cd Backend
```

Create `src/main/resources/application.properties`:

```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/meetspace?createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=update

# App JWT
app.jwt.secret=your-256-bit-secret-key-minimum-32-characters-long
app.jwt.expiration-ms=3600000

# LiveKit
livekit.api.key=YOUR_LIVEKIT_API_KEY
livekit.api.secret=YOUR_LIVEKIT_API_SECRET
livekit.url=wss://your-project.livekit.cloud
```

Run:

```bash
mvn clean install
mvn spring-boot:run
```

Backend starts at `http://localhost:8080`

### 3. Setup the Frontend

```bash
cd Frontend
npm install
```

Create `.env`:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_URL=http://localhost:8080/ws
```

Run:

```bash
npm run dev
```

Frontend starts at `http://localhost:5173`

### 4. Open in browser

Navigate to `http://localhost:5173`, sign up, create a room, and start your meeting!

---

## ⚙️ Environment Variables

### Backend (`application.properties`)

| Variable | Description | Example |
|----------|-------------|---------|
| `spring.datasource.url` | MySQL connection URL | `jdbc:mysql://localhost:3306/meetspace` |
| `spring.datasource.username` | DB username | `root` |
| `spring.datasource.password` | DB password | `your_password` |
| `app.jwt.secret` | Secret for APP JWT signing (min 32 chars) | `my-super-secret-key-for-jwt-signing` |
| `app.jwt.expiration-ms` | APP JWT lifetime in ms | `3600000` (1 hour) |
| `livekit.api.key` | LiveKit API Key | `APIxxxxxxxx` |
| `livekit.api.secret` | LiveKit API Secret | `your-livekit-secret` |
| `livekit.url` | LiveKit server WebSocket URL | `wss://your-project.livekit.cloud` |

### Frontend (`.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Spring Boot backend URL | `http://localhost:8080` |
| `VITE_WS_URL` | WebSocket endpoint URL | `http://localhost:8080/ws` |

---

## ✨ Features

- [x] **User Authentication** — Signup/Login with JWT
- [x] **Room Management** — Create, join, leave, close rooms
- [x] **Zoom-style Meeting IDs** — `abc-defg-hij` format
- [x] **HD Video Conferencing** — LiveKit SFU with simulcast
- [x] **Audio with Echo Cancellation** — Opus codec
- [x] **Screen Sharing** — Share screen, window, or tab
- [x] **Dynamic Video Grid** — Auto-adapts from 1 to 16+ participants
- [x] **Active Speaker Detection** — Glowing border on the speaking participant
- [x] **Mirrored Local Video** — Your camera view is mirrored, others see you normally
- [x] **In-call Chat** — Google Meet-style right drawer with timestamps
- [x] **Hand Raise** — Raise/lower hand with real-time broadcast
- [x] **Participant List** — See everyone's mic/camera status
- [x] **Role-based Controls** — Host can end meeting for all
- [x] **Unread Message Badge** — Chat notification counter
- [x] **Adaptive Streaming** — LiveKit selects quality per viewer's bandwidth
- [x] **Auto-expire Rooms** — Rooms expire after 4 hours
- [x] **Participant Cap** — Configurable max participants (default 100)
- [x] **Protected Routes** — AuthGuard on dashboard and room pages
- [x] **Page Transitions** — Framer Motion animations
- [x] **Dark Theme** — Full dark mode with glass morphism UI
- [x] **Responsive Design** — Works on desktop and tablet
- [x] **Toast Notifications** — Join/leave/error feedback
- [x] **Copy Meeting ID** — One-click copy to clipboard

---

## 📸 Screenshots

> Add screenshots of your running application here:
> - Landing page
> - Login/Signup
> - Dashboard
> - Video call with 2+ participants
> - Chat panel open
> - Participant list

---

<div align="center">

**Built by [Atharva Jagtap](https://github.com/atharvajagtap112)**

If this project helped you learn, give it a ⭐

</div>