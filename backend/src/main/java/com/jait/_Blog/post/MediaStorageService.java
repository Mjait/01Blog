package com.jait._Blog.post;

import com.jait._Blog.exception.ApiException;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
public class MediaStorageService {

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp"
    );

    private static final Set<String> ALLOWED_VIDEO_TYPES = Set.of(
            "video/mp4", "video/webm", "video/ogg"
    );

    private static final long MAX_IMAGE_SIZE = 10L * 1024 * 1024; // 10 MB
    private static final long MAX_VIDEO_SIZE = 50L * 1024 * 1024; // 50 MB

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    private Path uploadPath;

    public record StoredMedia(String mediaUrl, MediaType mediaType) {}

    @PostConstruct
    public void init() {
        try {
            this.uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(this.uploadPath);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize media upload directory", e);
        }
    }

    public StoredMedia storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return new StoredMedia(null, MediaType.NONE);
        }

        String contentType = file.getContentType();
        if (contentType == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "File content type is missing");
        }

        MediaType mediaType;
        if (ALLOWED_IMAGE_TYPES.contains(contentType)) {
            if (file.getSize() > MAX_IMAGE_SIZE) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Image size must not exceed 10MB");
            }
            mediaType = MediaType.IMAGE;
        } else if (ALLOWED_VIDEO_TYPES.contains(contentType)) {
            if (file.getSize() > MAX_VIDEO_SIZE) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Video size must not exceed 50MB");
            }
            mediaType = MediaType.VIDEO;
        } else {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Unsupported file type: " + contentType + ". Allowed: JPEG, PNG, GIF, WEBP, MP4, WEBM, OGG");
        }

        String originalFilename = StringUtils.cleanPath(
                file.getOriginalFilename() != null ? file.getOriginalFilename() : "file"
        );
        if (originalFilename.contains("..")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid filename path sequence");
        }

        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex >= 0) {
            extension = originalFilename.substring(dotIndex);
        }

        String storedFilename = UUID.randomUUID() + extension;
        Path targetLocation = this.uploadPath.resolve(storedFilename).normalize();

        if (!targetLocation.startsWith(this.uploadPath)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot store file outside upload directory");
        }

        try {
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return new StoredMedia("/uploads/" + storedFilename, mediaType);
        } catch (IOException ex) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store uploaded media file");
        }
    }

    public void deleteFileIfExists(String mediaUrl) {
        if (mediaUrl == null || !mediaUrl.startsWith("/uploads/")) {
            return;
        }
        String filename = mediaUrl.substring("/uploads/".length());
        Path filePath = this.uploadPath.resolve(filename).normalize();
        if (filePath.startsWith(this.uploadPath)) {
            try {
                Files.deleteIfExists(filePath);
            } catch (IOException ignored) {
            }
        }
    }
}
