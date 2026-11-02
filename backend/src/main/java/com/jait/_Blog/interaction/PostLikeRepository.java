package com.jait._Blog.interaction;

import com.jait._Blog.post.Post;
import com.jait._Blog.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {
    boolean existsByPostAndUser(Post post, User user);
    Optional<PostLike> findByPostAndUser(Post post, User user);
    long countByPost(Post post);
    void deleteAllByPost(Post post);
    void deleteAllByUser(User user);
}
