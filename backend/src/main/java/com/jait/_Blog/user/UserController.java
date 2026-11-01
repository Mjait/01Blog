package com.jait._Blog.user;

import com.jait._Blog.user.dto.UserProfileResponse;
import com.jait._Blog.user.dto.UserSummaryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/username/{username}")
    public ResponseEntity<UserProfileResponse> getProfileByUsername(
            @PathVariable String username,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(userService.getPublicProfileByUsername(username, currentUser));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserProfileResponse> getProfileById(
            @PathVariable Long userId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(userService.getPublicProfileById(userId, currentUser));
    }

    @PostMapping("/{userId}/subscribe")
    public ResponseEntity<UserProfileResponse> subscribe(
            @PathVariable Long userId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(userService.subscribe(userId, currentUser));
    }

    @DeleteMapping("/{userId}/subscribe")
    public ResponseEntity<UserProfileResponse> unsubscribe(
            @PathVariable Long userId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(userService.unsubscribe(userId, currentUser));
    }

    @GetMapping("/{userId}/followers")
    public ResponseEntity<List<UserSummaryResponse>> getFollowers(@PathVariable Long userId) {
        return ResponseEntity.ok(userService.getFollowers(userId));
    }

    @GetMapping("/{userId}/following")
    public ResponseEntity<List<UserSummaryResponse>> getFollowing(@PathVariable Long userId) {
        return ResponseEntity.ok(userService.getFollowing(userId));
    }
}