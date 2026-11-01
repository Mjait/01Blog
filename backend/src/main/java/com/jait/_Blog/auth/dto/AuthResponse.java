package com.jait._Blog.auth.dto;

import com.jait._Blog.user.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private Long id;
    private String username;
    private String email;
    private String bio;
    private String avatarUrl;
    private Role role;
}