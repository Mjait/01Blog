package com.jait._Blog.notification;

import com.jait._Blog.exception.ApiException;
import com.jait._Blog.notification.dto.NotificationResponse;
import com.jait._Blog.subscription.Subscription;
import com.jait._Blog.subscription.SubscriptionRepository;
import com.jait._Blog.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SubscriptionRepository subscriptionRepository;

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
                        .message(author.getUsername() + " published a new post")
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
                .actorId(n.getActor().getId())
                .actorUsername(n.getActor().getUsername())
                .postId(n.getPostId())
                .message(n.getMessage())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}