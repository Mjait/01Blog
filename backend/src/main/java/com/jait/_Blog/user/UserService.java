package com.jait._Blog.user;

import com.jait._Blog.exception.ApiException;
import com.jait._Blog.subscription.Subscription;
import com.jait._Blog.subscription.SubscriptionRepository;
import com.jait._Blog.user.dto.UserProfileResponse;
import com.jait._Blog.user.dto.UserSummaryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;

    @Transactional(readOnly = true)
    public UserProfileResponse getPublicProfileByUsername(String username, User currentUser) {
        User targetUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        return buildProfileResponse(targetUser, currentUser);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getPublicProfileById(Long userId, User currentUser) {
        User targetUser = getUserOrThrow(userId);
        return buildProfileResponse(targetUser, currentUser);
    }

    @Transactional
    public UserProfileResponse subscribe(Long targetUserId, User currentUser) {
        if (currentUser.getId().equals(targetUserId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You cannot subscribe to yourself");
        }

        User targetUser = getUserOrThrow(targetUserId);

        if (subscriptionRepository.existsBySubscriberAndTargetUser(currentUser, targetUser)) {
            throw new ApiException(HttpStatus.CONFLICT, "You are already subscribed to this user");
        }

        Subscription subscription = Subscription.builder()
                .subscriber(currentUser)
                .targetUser(targetUser)
                .build();

        subscriptionRepository.save(subscription);
        return buildProfileResponse(targetUser, currentUser);
    }

    @Transactional
    public UserProfileResponse unsubscribe(Long targetUserId, User currentUser) {
        User targetUser = getUserOrThrow(targetUserId);

        Subscription subscription = subscriptionRepository.findBySubscriberAndTargetUser(currentUser, targetUser)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "You are not subscribed to this user"));

        subscriptionRepository.delete(subscription);
        return buildProfileResponse(targetUser, currentUser);
    }

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> getFollowers(Long userId) {
        User targetUser = getUserOrThrow(userId);
        return subscriptionRepository.findAllByTargetUserOrderByCreatedAtDesc(targetUser)
                .stream()
                .map(sub -> toSummary(sub.getSubscriber()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> getFollowing(Long userId) {
        User subscriber = getUserOrThrow(userId);
        return subscriptionRepository.findAllBySubscriberOrderByCreatedAtDesc(subscriber)
                .stream()
                .map(sub -> toSummary(sub.getTargetUser()))
                .toList();
    }

    public User getUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private UserProfileResponse buildProfileResponse(User targetUser, User currentUser) {
        long followersCount = subscriptionRepository.countByTargetUser(targetUser);
        long followingCount = subscriptionRepository.countBySubscriber(targetUser);
        boolean isSubscribed = currentUser != null
                && !currentUser.getId().equals(targetUser.getId())
                && subscriptionRepository.existsBySubscriberAndTargetUser(currentUser, targetUser);

        return UserProfileResponse.builder()
                .id(targetUser.getId())
                .username(targetUser.getUsername())
                .bio(targetUser.getBio())
                .avatarUrl(targetUser.getAvatarUrl())
                .role(targetUser.getRole())
                .createdAt(targetUser.getCreatedAt())
                .followersCount(followersCount)
                .followingCount(followingCount)
                .subscribedByCurrentUser(isSubscribed)
                .build();
    }

    private UserSummaryResponse toSummary(User user) {
        return UserSummaryResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .bio(user.getBio())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }
}