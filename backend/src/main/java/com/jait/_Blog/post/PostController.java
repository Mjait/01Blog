package com.jait._Blog.post;

import com.jait._Blog.post.dto.PostResponse;
import com.jait._Blog.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    public record MessageResponse(String message) {}

    @PostMapping(value = "/posts", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PostResponse> createPost(
            @RequestParam("content") String content,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(postService.createPost(content, file, currentUser));
    }

    @PutMapping(value = "/posts/{postId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PostResponse> updatePost(
            @PathVariable Long postId,
            @RequestParam("content") String content,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "removeMedia", defaultValue = "false") boolean removeMedia,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(postService.updatePost(postId, content, file, removeMedia, currentUser));
    }

    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<MessageResponse> deletePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal User currentUser) {
        postService.deletePost(postId, currentUser);
        return ResponseEntity.ok(new MessageResponse("Post deleted successfully"));
    }

    @GetMapping("/posts/{postId}")
    public ResponseEntity<PostResponse> getPostById(
            @PathVariable Long postId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(postService.getPostById(postId, currentUser));
    }

    @GetMapping("/posts/feed")
    public List<PostResponse> getSubscribedFeed(
            @AuthenticationPrincipal User currentUser) {
        return postService.getSubscribedFeed(currentUser);
    }

    @GetMapping("/posts")
    public List<PostResponse> getAllPublicPosts(
            @AuthenticationPrincipal User currentUser) {
        return postService.getAllPublicPosts(currentUser);
    }

    @GetMapping("/users/{userId}/posts")
    public List<PostResponse> getUserPosts(
            @PathVariable Long userId,
            @AuthenticationPrincipal User currentUser) {
        return postService.getPostsByUser(userId, currentUser);
    }
}