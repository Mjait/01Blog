package com.jait._Blog.post;

import com.jait._Blog.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findAllByAuthorAndHiddenFalseOrderByCreatedAtDesc(User author);
    List<Post> findAllByAuthorInAndHiddenFalseOrderByCreatedAtDesc(List<User> authors);
    List<Post> findAllByHiddenFalseOrderByCreatedAtDesc();
}