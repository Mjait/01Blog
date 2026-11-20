package com.jait._Blog.user.dto;

import com.jait._Blog.user.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
public class UserProfileResponse {
    private Long id;
    private String username;
    private String bio;
    private String avatarUrl;
    private Role role;
    private LocalDateTime createdAt;
    private long followersCount;
    private long followingCount;
    private boolean subscribedByCurrentUser;
}