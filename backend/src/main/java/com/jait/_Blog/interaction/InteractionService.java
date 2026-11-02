package com.jait._Blog.interaction;

import com.jait._Blog.exception.ApiException;
import com.jait._Blog.interaction.dto.CommentRequest;
import com.jait._Blog.interaction.dto.CommentResponse;
import com.jait._Blog.post.Post;
import com.jait._Blog.post.PostService;
import com.jait._Blog.post.dto.PostResponse;
import com.jait._Blog.user.Role;
import com.jait._Blog.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InteractionService {

    private final PostLikeRepository postLikeRepository;
    private final CommentRepository commentRepository;
    private final PostService postService;

    @Transactional
    public PostResponse likePost(Long postId, User currentUser) {
        Post post = postService.getPostOrThrow(postId);
        if (post.isHidden()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Post not found");
        }

        if (postLikeRepository.existsByPostAndUser(post, currentUser)) {
            throw new ApiException(HttpStatus.CONFLICT, "You have already liked this post");
        }

        PostLike like = PostLike.builder()
                .post(post)
                .user(currentUser)
                .build();

        postLikeRepository.save(like);
        return postService.toResponse(post, currentUser);
    }

    @Transactional
    public PostResponse unlikePost(Long postId, User currentUser) {
        Post post = postService.getPostOrThrow(postId);

        PostLike like = postLikeRepository.findByPostAndUser(post, currentUser)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "You have not liked this post"));

        postLikeRepository.delete(like);
        return postService.toResponse(post, currentUser);
    }

    @Transactional
    public CommentResponse addComment(Long postId, CommentRequest request, User currentUser) {
        Post post = postService.getPostOrThrow(postId);
        if (post.isHidden()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Post not found");
        }

        Comment comment = Comment.builder()
                .post(post)
                .author(currentUser)
                .content(request.getContent().trim())
                .build();

        return toCommentResponse(commentRepository.save(comment));
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getCommentsForPost(Long postId) {
        Post post = postService.getPostOrThrow(postId);
        if (post.isHidden()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Post not found");
        }

        return commentRepository.findAllByPostOrderByCreatedAtAsc(post)
                .stream()
                .map(this::toCommentResponse)
                .toList();
    }

    @Transactional
    public void deleteComment(Long commentId, User currentUser) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Comment not found"));

        boolean isCommentAuthor = comment.getAuthor().getId().equals(currentUser.getId());
        boolean isPostAuthor = comment.getPost().getAuthor().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;

        if (!isCommentAuthor && !isPostAuthor && !isAdmin) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You are not authorized to delete this comment");
        }

        commentRepository.delete(comment);
    }

    private CommentResponse toCommentResponse(Comment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .postId(comment.getPost().getId())
                .authorId(comment.getAuthor().getId())
                .authorUsername(comment.getAuthor().getUsername())
                .authorAvatarUrl(comment.getAuthor().getAvatarUrl())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
