# LiveKit Recording Setup

## Current Status: ⚠️ Recording Disabled for Local Development

The AI summary feature requires LiveKit egress for recording, which has connectivity issues in the local Docker development setup.

### What Works ✅
- ✅ Video conferencing (real-time video/audio)
- ✅ Screen sharing
- ✅ In-call chat
- ✅ Hand raising
- ✅ Participant management
- ✅ Room creation/joining/closing
- ✅ Meeting history

### What Doesn't Work ❌
- ❌ Meeting recordings
- ❌ AI-powered meeting summaries (requires recordings)
- ❌ Transcriptions

---

## Why Recording Doesn't Work Locally

The issue: **LiveKit server in dev mode doesn't proxy egress API requests**

1. Spring Boot tries to start recording via: `POST http://localhost:7880/twirp/livekit.Egress/StartRoomCompositeEgress`
2. LiveKit server (port 7880) receives the request but **times out** without responding
3. The egress container is running and healthy, but isolated in Docker network
4. In dev mode (`--dev` flag), LiveKit doesn't enable full egress API routing

### Error Logs
```
java.net.SocketTimeoutException: Read timed out
    at retrofit2.OkHttpCall.execute(OkHttpCall.java:204)
    at LiveKitRecordingServiceImpl.startRecording()
```

---

## How to Enable Recording (Production)

### Option 1: LiveKit Cloud (Recommended for Production)

1. Sign up at https://livekit.io/
2. Create a project and get credentials
3. Choose a paid plan with Egress support ($29+/month)
4. Update `.env`:
   ```env
   API_KEY=your_cloud_api_key
   API_SECRET=your_cloud_api_secret
   API_URL=wss://your-project.livekit.cloud
   ```
5. Recordings will work automatically

### Option 2: Self-Hosted LiveKit (Advanced)

Requires proper LiveKit server configuration (not dev mode):

1. Create `livekit.yaml` config file:
   ```yaml
   port: 7880
   rtc:
     port_range_start: 50000
     port_range_end: 60000
     use_external_ip: true
   
   keys:
     devkey: devsecret
   
   # Enable egress service
   egress:
     enabled: true
   ```

2. Update `docker-compose.yml`:
   ```yaml
   livekit:
     command: --config /etc/livekit.yaml  # Remove --dev flag
     volumes:
       - ./livekit.yaml:/etc/livekit.yaml
   ```

3. Restart containers:
   ```bash
   docker compose down
   docker compose up -d
   ```

4. Test recording endpoint:
   ```bash
   curl http://localhost:7880/twirp/livekit.Egress/ListEgress \
     -H "Authorization: Bearer $(generate_jwt_token)" \
     -H "Content-Type: application/json"
   ```

---

## Alternative: Manual Recording for Testing

For local testing without full egress setup:

1. Use OBS Studio or browser-based recording
2. Save recording as `.ogg` file
3. Manually place in `LiveKit/recordings/{meeting-id}.ogg`
4. The AI pipeline will pick it up on meeting close

---

## Technical Details

### Egress Architecture
```
Spring Boot (Host)  →  LiveKit Server (Container: livekit:7880)
                          ↓
                       Egress API Request
                          ↓
                       LiveKit Egress (Container: livekit-egress)
                          ↓
                       Recording File → Volume Mount → Host
```

### Current Setup
- **LiveKit Server**: Running in dev mode (`--dev --bind 0.0.0.0`)
- **Egress Container**: Healthy and connected to Redis
- **Problem**: Dev mode doesn't route egress API requests
- **Fix Required**: Production config with `egress.enabled: true`

### Files Involved
- `Backend/src/main/java/com/atharva/backend/sfu/LiveKitRecordingServiceImpl.java` - Recording logic
- `Backend/src/main/java/com/atharva/backend/ai/service/MeetingAiPipelineService.java` - AI pipeline
- `LiveKit/docker-compose.yml` - Container orchestration
- `LiveKit/egress-config/config.yaml` - Egress configuration

---

## For Deployment

When deploying to production (AWS, Render, etc.):

1. Use LiveKit Cloud (easiest)
2. Or deploy self-hosted LiveKit with proper configuration
3. Ensure firewall allows: 7880 (HTTP), 7881 (TCP), 7882 (UDP)
4. Configure external IP for WebRTC
5. Test recording with a real meeting

---

## Summary

**For local development**: Recording feature is **intentionally disabled** to prevent timeouts. All core video conferencing features work perfectly.

**For production**: Use **LiveKit Cloud** or properly configured self-hosted LiveKit with egress enabled.
