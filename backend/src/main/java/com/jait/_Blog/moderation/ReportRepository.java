package com.jait._Blog.moderation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findAllByOrderByCreatedAtDesc();
    void deleteAllByReportedUserId(Long userId);
    void deleteAllByReportedPostId(Long postId);
}
