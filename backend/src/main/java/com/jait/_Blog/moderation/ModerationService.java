package com.jait._Blog.moderation;

import com.jait._Blog.exception.ApiException;
import com.jait._Blog.interaction.CommentRepository;
import com.jait._Blog.interaction.PostLikeRepository;
import com.jait._Blog.moderation.dto.AdminUserResponse;
import com.jait._Blog.moderation.dto.ReportRequest;
import com.jait._Blog.moderation.dto.ReportResponse;
import com.jait._Blog.notification.NotificationRepository;
import com.jait._Blog.post.MediaStorageService;
import com.jait._Blog.post.Post;
import com.jait._Blog.post.PostRepository;
import com.jait._Blog.post.PostService;
import com.jait._Blog.post.dto.PostResponse;
import com.jait._Blog.subscription.SubscriptionRepository;
import com.jait._Blog.user.User;
import com.jait._Blog.user.UserRepository;
import com.jait._Blog.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ModerationService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final PostService postService;
    private final SubscriptionRepository subscriptionRepository;
    private final PostLikeRepository postLikeRepository;
    private final CommentRepository commentRepository;
    private final NotificationRepository notificationRepository;
    private final MediaStorageService mediaStorageService;
    private final UserService userService;

    @Transactional
    public ReportResponse reportUser(Long userId, ReportRequest request, User currentUser) {
        User reportedUser = userService.getUserOrThrow(userId);

        if (currentUser.getId().equals(reportedUser.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You cannot report yourself");
        }

        Post reportedPost = null;
        if (request.getReportedPostId() != null) {
            reportedPost = postRepository.findById(request.getReportedPostId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Reported post not found"));
        }

        Report report = Report.builder()
                .reporter(currentUser)
                .reportedUser(reportedUser)
                .reportedPost(reportedPost)
                .reason(request.getReason().trim())
                .build();

        return toResponse(reportRepository.save(report));
    }

    @Transactional(readOnly = true)
    public List<ReportResponse> getAllReports() {
        return reportRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AdminUserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::toAdminUserResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PostResponse> getAllPostsForAdmin(User currentAdmin) {
        return postRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(post -> postService.toResponse(post, currentAdmin))
                .toList();
    }

    @Transactional
    public AdminUserResponse setUserBanStatus(Long userId, boolean banned, User currentAdmin) {
        if (currentAdmin.getId().equals(userId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Administrators cannot ban themselves");
        }
        User user = userService.getUserOrThrow(userId);
        user.setBanned(banned);
        return toAdminUserResponse(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(Long userId, User currentAdmin) {
        if (currentAdmin.getId().equals(userId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Administrators cannot delete their own account");
        }
        User user = userService.getUserOrThrow(userId);

        // 1. Delete all posts authored by this user (and their likes/comments/notifications/reports)
        List<Post> userPosts = postRepository.findAllByAuthorOrderByCreatedAtDesc(user);
        for (Post post : userPosts) {
            mediaStorageService.deleteFileIfExists(post.getMediaUrl());
            postLikeRepository.deleteAllByPost(post);
            commentRepository.deleteAllByPost(post);
            notificationRepository.deleteAllByPostId(post.getId());
            reportRepository.deleteAllByReportedPostId(post.getId());
            postRepository.delete(post);
        }

        // 2. Delete interactions, notifications, reports, and subscriptions involving this user
        postLikeRepository.deleteAllByUser(user);
        commentRepository.deleteAllByAuthor(user);
        notificationRepository.deleteAllByRecipient(user);
        notificationRepository.deleteAllByActor(user);
        reportRepository.deleteAllByReportedUser(user);
        reportRepository.deleteAllByReporter(user);
        subscriptionRepository.deleteAll(subscriptionRepository.findAllByTargetUserOrderByCreatedAtDesc(user));
        subscriptionRepository.deleteAll(subscriptionRepository.findAllBySubscriberOrderByCreatedAtDesc(user));

        // 3. Delete the user
        userRepository.delete(user);
    }

    @Transactional
    public void removeOrHidePost(Long postId, boolean hideOnly) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Post not found"));

        if (hideOnly) {
            post.setHidden(true);
            postRepository.save(post);
        } else {
            mediaStorageService.deleteFileIfExists(post.getMediaUrl());
            postLikeRepository.deleteAllByPost(post);
            commentRepository.deleteAllByPost(post);
            notificationRepository.deleteAllByPostId(postId);
            reportRepository.deleteAllByReportedPostId(postId);
            postRepository.delete(post);
        }
    }

    @Transactional
    public PostResponse setPostHiddenStatus(Long postId, boolean hidden, User currentAdmin) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Post not found"));
        post.setHidden(hidden);
        return postService.toResponse(postRepository.save(post), currentAdmin);
    }

    private AdminUserResponse toAdminUserResponse(User user) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .bio(user.getBio())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .banned(user.isBanned())
                .postsCount(postRepository.countByAuthor(user))
                .createdAt(user.getCreatedAt())
                .build();
    }

    private ReportResponse toResponse(Report r) {
        return ReportResponse.builder()
                .id(r.getId())
                .reporterId(r.getReporter().getId())
                .reporterUsername(r.getReporter().getUsername())
                .reportedUserId(r.getReportedUser().getId())
                .reportedUsername(r.getReportedUser().getUsername())
                .reportedPostId(r.getReportedPost() != null ? r.getReportedPost().getId() : null)
                .reason(r.getReason())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
