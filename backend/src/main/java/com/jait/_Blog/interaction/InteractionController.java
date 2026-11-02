package com.jait._Blog.interaction;

import com.jait._Blog.interaction.dto.CommentRequest;
import com.jait._Blog.interaction.dto.CommentResponse;
import com.jait._Blog.post.dto.PostResponse;
import com.jait._Blog.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class InteractionController {

    private final InteractionService interactionService;

    public record MessageResponse(String message) {}

    @PostMapping("/posts/{postId}/like")
    public ResponseEntity<PostResponse> likePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(interactionService.likePost(postId, currentUser));
    }

    @DeleteMapping("/posts/{postId}/like")
    public ResponseEntity<PostResponse> unlikePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(interactionService.unlikePost(postId, currentUser));
    }

    @GetMapping("/posts/{postId}/comments")
    public List<CommentResponse> getComments(@PathVariable Long postId) {
        return interactionService.getCommentsForPost(postId);
    }

    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long postId,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(interactionService.addComment(postId, request, currentUser));
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<MessageResponse> deleteComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal User currentUser) {
        interactionService.deleteComment(commentId, currentUser);
        return ResponseEntity.ok(new MessageResponse("Comment deleted successfully"));
    }
}
