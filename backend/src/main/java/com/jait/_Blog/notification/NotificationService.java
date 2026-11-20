package com.jait._Blog.notification;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.jait._Blog.exception.ApiException;
import com.jait._Blog.notification.dto.NotificationResponse;
import com.jait._Blog.subscription.Subscription;
import com.jait._Blog.subscription.SubscriptionRepository;
import com.jait._Blog.user.Role;
import com.jait._Blog.user.User;
import com.jait._Blog.user.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;

    // دالة عامة لإنشاء إشعار عادي (Like, Comment, Follow)
    @Transactional
    public void sendNotification(User recipient, User actor, Long postId, String message, NotificationType type) {
        // لا ترسل إشعاراً إذا تفاعل المستخدم مع منشوره الخاص
        if (recipient.getId().equals(actor.getId())) {
            return;
        }

        Notification notification = Notification.builder()
                .recipient(recipient)
                .actor(actor)
                .postId(postId)
                .message(message)
                .type(type)
                .read(false)
                .build();

        notificationRepository.save(notification);
    }

    // إشعار جميع المشرفين عند إرسال تبليغ جديد
@Transactional
    public void notifyAdminsAboutReport(User reporter, User reportedUser, Long postId, String reason) {
        List<User> admins = userRepository.findAllByRole(Role.ADMIN);
        if (admins.isEmpty()) {
            return;
        }

        String targetText = (postId != null) ? "Post #" + postId : "@" + reportedUser.getUsername();
        String message = "🚩 @" + reporter.getUsername() + " reported " + targetText + ": \"" + reason + "\"";

        List<Notification> notifications = admins.stream()
                .filter(admin -> !admin.getId().equals(reporter.getId()))
                .map(admin -> Notification.builder()
                        .recipient(admin)
                        .actor(reportedUser) // <-- هنا: actor ولا هو الشخص المبلّغ عليه!
                        .postId(postId)
                        .message(message)
                        .type(NotificationType.REPORT)
                        .read(false)
                        .build())
                .toList();

        notificationRepository.saveAll(notifications);
    }

    @Transactional
    public void notifySubscribersOfNewPost(User author, Long postId) {
        List<Subscription> followers = subscriptionRepository.findAllByTargetUserOrderByCreatedAtDesc(author);
        if (followers.isEmpty()) {
            return;
        }

        List<Notification> notifications = followers.stream()
                .map(sub -> Notification.builder()
                        .recipient(sub.getSubscriber())
                        .actor(author)
                        .postId(postId)
                        .message("@" + author.getUsername() + " published a new post")
                        .type(NotificationType.FOLLOW)
                        .read(false)
                        .build())
                .toList();

        notificationRepository.saveAll(notifications);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getUserNotifications(User currentUser) {
        return notificationRepository.findAllByRecipientOrderByCreatedAtDesc(currentUser)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(User currentUser) {
        return notificationRepository.countByRecipientAndReadFalse(currentUser);
    }

    @Transactional
    public NotificationResponse updateReadStatus(Long notificationId, boolean read, User currentUser) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notification not found"));

        if (!notification.getRecipient().getId().equals(currentUser.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You cannot modify another user's notification");
        }

        notification.setRead(read);
        return toResponse(notificationRepository.save(notification));
    }

    @Transactional
    public void markAllAsRead(User currentUser) {
        List<Notification> notifications = notificationRepository.findAllByRecipientOrderByCreatedAtDesc(currentUser);
        notifications.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(notifications);
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .recipientId(n.getRecipient().getId())
                .actorId(n.getActor().getId())
                .actorUsername(n.getActor().getUsername())
                .postId(n.getPostId())
                .message(n.getMessage())
                .type(n.getType())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}