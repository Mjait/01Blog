package com.jait._Blog.post.dto;

import com.jait._Blog.post.MediaType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
public class PostResponse {
    private Long id;
    private Long authorId;
    private String authorUsername;
    private String authorAvatarUrl;
    private String content;
    private String mediaUrl;
    private MediaType mediaType;
    private boolean hidden;
    private long likesCount;
    private long commentsCount;
    private boolean likedByCurrentUser;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}