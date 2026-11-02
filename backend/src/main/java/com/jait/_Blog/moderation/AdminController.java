package com.jait._Blog.moderation;

import com.jait._Blog.moderation.dto.AdminUserResponse;
import com.jait._Blog.moderation.dto.ReportResponse;
import com.jait._Blog.post.dto.PostResponse;
import com.jait._Blog.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final ModerationService moderationService;

    public record MessageResponse(String message) {}

    @GetMapping("/reports")
    public List<ReportResponse> getAllReports() {
        return moderationService.getAllReports();
    }

    @GetMapping("/users")
    public List<AdminUserResponse> getAllUsers() {
        return moderationService.getAllUsers();
    }

    @GetMapping("/posts")
    public List<PostResponse> getAllPosts(@AuthenticationPrincipal User currentAdmin) {
        return moderationService.getAllPostsForAdmin(currentAdmin);
    }

    @PatchMapping("/users/{userId}/ban")
    public ResponseEntity<AdminUserResponse> setBanStatus(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "true") boolean banned,
            @AuthenticationPrincipal User currentAdmin) {
        return ResponseEntity.ok(moderationService.setUserBanStatus(userId, banned, currentAdmin));
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<MessageResponse> deleteUser(
            @PathVariable Long userId,
            @AuthenticationPrincipal User currentAdmin) {
        moderationService.deleteUser(userId, currentAdmin);
        return ResponseEntity.ok(new MessageResponse("User and associated data deleted successfully"));
    }

    @PatchMapping("/posts/{postId}/hide")
    public ResponseEntity<PostResponse> hidePost(
            @PathVariable Long postId,
            @RequestParam(defaultValue = "true") boolean hide,
            @AuthenticationPrincipal User currentAdmin) {
        return ResponseEntity.ok(moderationService.setPostHiddenStatus(postId, hide, currentAdmin));
    }

    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<MessageResponse> deletePost(@PathVariable Long postId) {
        moderationService.removeOrHidePost(postId, false);
        return ResponseEntity.ok(new MessageResponse("Post removed by administrator"));
    }
}
