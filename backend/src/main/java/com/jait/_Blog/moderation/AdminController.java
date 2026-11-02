package com.jait._Blog.moderation;

import com.jait._Blog.moderation.dto.ReportResponse;
import com.jait._Blog.user.User;
import com.jait._Blog.user.UserRepository;
import com.jait._Blog.user.dto.UserProfileResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final ModerationService moderationService;
    private final UserRepository userRepository;

    public record MessageResponse(String message) {}

    @GetMapping("/reports")
    public List<ReportResponse> getAllReports() {
        return moderationService.getAllReports();
    }

    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @PatchMapping("/users/{userId}/ban")
    public ResponseEntity<MessageResponse> banUser(@PathVariable Long userId) {
        moderationService.banUser(userId);
        return ResponseEntity.ok(new MessageResponse("User banned successfully"));
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<MessageResponse> deleteUser(@PathVariable Long userId) {
        moderationService.deleteUser(userId);
        return ResponseEntity.ok(new MessageResponse("User and associated data deleted successfully"));
    }

    @PatchMapping("/posts/{postId}/hide")
    public ResponseEntity<MessageResponse> hidePost(
            @PathVariable Long postId,
            @RequestParam(defaultValue = "true") boolean hide) {
        moderationService.removeOrHidePost(postId, hide);
        return ResponseEntity.ok(new MessageResponse("Post hidden status updated"));
    }

    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<MessageResponse> deletePost(@PathVariable Long postId) {
        moderationService.removeOrHidePost(postId, false);
        return ResponseEntity.ok(new MessageResponse("Post removed by administrator"));
    }
}
