package com.jait._Blog.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
public class NotificationResponse {
    private Long id;
    private Long actorId;
    private String actorUsername;
    private Long postId;
    private String message;
    private boolean read;
    private LocalDateTime createdAt;
}