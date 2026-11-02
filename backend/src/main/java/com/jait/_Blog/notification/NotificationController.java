package com.jait._Blog.notification;

import com.jait._Blog.notification.dto.NotificationResponse;
import com.jait._Blog.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    public record UnreadCountResponse(long unreadCount) {}
    public record MessageResponse(String message) {}

    @GetMapping
    public List<NotificationResponse> getMyNotifications(
            @AuthenticationPrincipal User currentUser) {
        return notificationService.getUserNotifications(currentUser);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<UnreadCountResponse> getUnreadCount(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(new UnreadCountResponse(notificationService.getUnreadCount(currentUser)));
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<NotificationResponse> setReadStatus(
            @PathVariable Long notificationId,
            @RequestParam(defaultValue = "true") boolean read,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(notificationService.updateReadStatus(notificationId, read, currentUser));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<MessageResponse> markAllAsRead(
            @AuthenticationPrincipal User currentUser) {
        notificationService.markAllAsRead(currentUser);
        return ResponseEntity.ok(new MessageResponse("All notifications marked as read"));
    }
}