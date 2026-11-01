package com.jait._Blog.subscription;

import com.jait._Blog.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    boolean existsBySubscriberAndTargetUser(User subscriber, User targetUser);
    Optional<Subscription> findBySubscriberAndTargetUser(User subscriber, User targetUser);
    long countByTargetUser(User targetUser);
    long countBySubscriber(User subscriber);
    List<Subscription> findAllByTargetUserOrderByCreatedAtDesc(User targetUser);
    List<Subscription> findAllBySubscriberOrderByCreatedAtDesc(User subscriber);
}