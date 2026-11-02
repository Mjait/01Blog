package com.jait._Blog.moderation.dto;

import com.jait._Blog.user.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
public class AdminUserResponse {
    private Long id;
    private String username;
    private String email;
    private String bio;
    private String avatarUrl;
    private Role role;
    private boolean banned;
    private long postsCount;
    private LocalDateTime createdAt;
}
