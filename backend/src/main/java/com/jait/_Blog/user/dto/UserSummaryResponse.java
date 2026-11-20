package com.jait._Blog.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class UserSummaryResponse {
    private Long id;
    private String username;
    private String bio;
    private String avatarUrl;
}