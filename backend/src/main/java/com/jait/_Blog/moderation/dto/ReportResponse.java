package com.jait._Blog.moderation.dto;

import com.jait._Blog.moderation.ReportStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
public class ReportResponse {
    private Long id;
    private Long reporterId;
    private String reporterUsername;
    private Long reportedUserId;
    private String reportedUsername;
    private Long reportedPostId;
    private String reason;
    private ReportStatus status;
    private LocalDateTime createdAt;
}
