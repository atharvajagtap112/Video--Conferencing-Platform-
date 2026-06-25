package com.atharva.backend.room;

import com.atharva.backend.auth.entity.User;
import com.atharva.backend.room.dto.CreateRoomRequest;
import com.atharva.backend.room.dto.JoinRoomResponse;
import com.atharva.backend.room.dto.MeetingHistoryItemDto;
import com.atharva.backend.room.dto.RoomResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    @PostMapping("/create")
    public ResponseEntity<RoomResponse> createRoom(                            //What Spring does
            @AuthenticationPrincipal User user,                                //JWT Filter runs.
            @RequestBody CreateRoomRequest req                                 //Extracts username from JWT.
            ) {                                                                //Loads user from database.
        return ResponseEntity.ok(roomService.createRoom(user, req));           //Creates Authentication object.
     }                                                                         //Stores it in SecurityContext.
                                                                               //Then Spring sees:
                                                                               //
                                                                               //@AuthenticationPrincipal User user
    @PostMapping("/{meetingId}/join")
    public ResponseEntity<JoinRoomResponse> joinRoom(
            @AuthenticationPrincipal User user,
            @PathVariable String meetingId
    ) {
        return ResponseEntity.ok(roomService.joinRoom(user, meetingId));
    }

    @PostMapping("/{meetingId}/leave")
    public ResponseEntity<Void> leaveRoom(
            @AuthenticationPrincipal User user,
            @PathVariable String meetingId
    ) {
        roomService.leaveRoom(user, meetingId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{meetingId}/close")
    public ResponseEntity<Void> closeRoom(
            @AuthenticationPrincipal User user,
            @PathVariable String meetingId
    ) {
        roomService.closeRoom(user, meetingId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("history")
    public List<MeetingHistoryItemDto> meetingHistory(@AuthenticationPrincipal User user){
        return  roomService.getMeetingHistory(user);
    }
}