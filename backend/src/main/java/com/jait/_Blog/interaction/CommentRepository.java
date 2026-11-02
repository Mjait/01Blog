package com.jait._Blog.interaction;

import com.jait._Blog.post.Post;
import com.jait._Blog.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findAllByPostOrderByCreatedAtAsc(Post post);
    long countByPost(Post post);
    void deleteAllByPost(Post post);
    void deleteAllByAuthor(User author);
}
