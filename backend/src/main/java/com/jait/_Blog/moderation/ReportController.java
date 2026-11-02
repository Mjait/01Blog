package com.jait._Blog.moderation;

import com.jait._Blog.moderation.dto.ReportRequest;
import com.jait._Blog.moderation.dto.ReportResponse;
import com.jait._Blog.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class ReportController {

    private final ModerationService moderationService;

    @PostMapping("/{userId}/report")
    public ResponseEntity<ReportResponse> reportUser(
            @PathVariable Long userId,
            @Valid @RequestBody ReportRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(moderationService.reportUser(userId, request, currentUser));
    }
}
