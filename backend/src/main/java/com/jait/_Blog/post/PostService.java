package com.jait._Blog.post;

import com.jait._Blog.exception.ApiException;
import com.jait._Blog.interaction.CommentRepository;
import com.jait._Blog.interaction.PostLikeRepository;
import com.jait._Blog.notification.NotificationRepository;
import com.jait._Blog.notification.NotificationService;
import com.jait._Blog.post.dto.PostResponse;
import com.jait._Blog.subscription.SubscriptionRepository;
import com.jait._Blog.user.Role;
import com.jait._Blog.user.User;
import com.jait._Blog.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final MediaStorageService mediaStorageService;
    private final SubscriptionRepository subscriptionRepository;
    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;
    private final PostLikeRepository postLikeRepository;
    private final CommentRepository commentRepository;
    private final UserService userService;

    @Transactional
    public PostResponse createPost(String content, MultipartFile mediaFile, User currentUser) {
        String trimmedContent = content != null ? content.trim() : "";
        if (trimmedContent.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Post content cannot be empty");
        }

        MediaStorageService.StoredMedia storedMedia = mediaStorageService.storeFile(mediaFile);

        Post post = Post.builder()
                .author(currentUser)
                .content(trimmedContent)
                .mediaUrl(storedMedia.mediaUrl())
                .mediaType(storedMedia.mediaType())
                .hidden(false)
                .build();

        Post savedPost = postRepository.save(post);
        notificationService.notifySubscribersOfNewPost(currentUser, savedPost.getId());

        return toResponse(savedPost, currentUser);
    }

    @Transactional
    public PostResponse updatePost(
            Long postId,
            String content,
            MultipartFile mediaFile,
            boolean removeMedia,
            User currentUser) {

        Post post = getPostOrThrow(postId);

        if (!post.getAuthor().getId().equals(currentUser.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You can only edit your own posts");
        }

        String trimmedContent = content != null ? content.trim() : "";
        if (trimmedContent.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Post content cannot be empty");
        }

        post.setContent(trimmedContent);

        if (mediaFile != null && !mediaFile.isEmpty()) {
            mediaStorageService.deleteFileIfExists(post.getMediaUrl());
            MediaStorageService.StoredMedia storedMedia = mediaStorageService.storeFile(mediaFile);
            post.setMediaUrl(storedMedia.mediaUrl());
            post.setMediaType(storedMedia.mediaType());
        } else if (removeMedia) {
            mediaStorageService.deleteFileIfExists(post.getMediaUrl());
            post.setMediaUrl(null);
            post.setMediaType(MediaType.NONE);
        }

        return toResponse(postRepository.save(post), currentUser);
    }

    @Transactional
    public void deletePost(Long postId, User currentUser) {
        Post post = getPostOrThrow(postId);

        boolean isOwner = post.getAuthor().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You are not authorized to delete this post");
        }

        mediaStorageService.deleteFileIfExists(post.getMediaUrl());
        postLikeRepository.deleteAllByPost(post);
        commentRepository.deleteAllByPost(post);
        notificationRepository.deleteAllByPostId(postId);
        postRepository.delete(post);
    }

    @Transactional(readOnly = true)
    public PostResponse getPostById(Long postId, User currentUser) {
        Post post = getPostOrThrow(postId);
        if (post.isHidden() && currentUser.getRole() != Role.ADMIN) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Post not found");
        }
        return toResponse(post, currentUser);
    }

    @Transactional(readOnly = true)
    public List<PostResponse> getPostsByUser(Long userId, User currentUser) {
        User author = userService.getUserOrThrow(userId);
        return postRepository.findAllByAuthorAndHiddenFalseOrderByCreatedAtDesc(author)
                .stream()
                .map(post -> toResponse(post, currentUser))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PostResponse> getSubscribedFeed(User currentUser) {
        List<User> subscribedAuthors = subscriptionRepository
                .findAllBySubscriberOrderByCreatedAtDesc(currentUser)
                .stream()
                .map(sub -> sub.getTargetUser())
                .toList();

        if (subscribedAuthors.isEmpty()) {
            return List.of();
        }

        return postRepository.findAllByAuthorInAndHiddenFalseOrderByCreatedAtDesc(subscribedAuthors)
                .stream()
                .map(post -> toResponse(post, currentUser))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PostResponse> getAllPublicPosts(User currentUser) {
        return postRepository.findAllByHiddenFalseOrderByCreatedAtDesc()
                .stream()
                .map(post -> toResponse(post, currentUser))
                .toList();
    }

    public Post getPostOrThrow(Long postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Post not found"));
    }

    public PostResponse toResponse(Post post, User currentUser) {
        long likesCount = postLikeRepository.countByPost(post);
        long commentsCount = commentRepository.countByPost(post);
        boolean likedByCurrentUser = currentUser != null
                && postLikeRepository.existsByPostAndUser(post, currentUser);

        return PostResponse.builder()
                .id(post.getId())
                .authorId(post.getAuthor().getId())
                .authorUsername(post.getAuthor().getUsername())
                .authorAvatarUrl(post.getAuthor().getAvatarUrl())
                .content(post.getContent())
                .mediaUrl(post.getMediaUrl())
                .mediaType(post.getMediaType())
                .hidden(post.isHidden())
                .likesCount(likesCount)
                .commentsCount(commentsCount)
                .likedByCurrentUser(likedByCurrentUser)
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }
}
