package com.jait._Blog.moderation;

import com.jait._Blog.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findAllByOrderByCreatedAtDesc();
    void deleteAllByReportedUser(User user);
    void deleteAllByReporter(User user);
    void deleteAllByReportedPostId(Long postId);
}
