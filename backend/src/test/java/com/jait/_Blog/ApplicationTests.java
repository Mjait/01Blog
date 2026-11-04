package com.jait._Blog;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    // =========================================================================
    // 1. AuthService Tests (Registration, Login, Role Escalation Prevention)
    // =========================================================================
    @Nested
    @DisplayName("1. AuthService Tests")
    class AuthServiceTests {

        @Test
        @DisplayName("Auth 1: Register and login with valid credentials returns JWT and USER role")
        void registerAndLoginSuccess() throws Exception {
            registerUser("authuser1", "authuser1@01blog.com", "password123");

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"usernameOrEmail\":\"authuser1\",\"password\":\"password123\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.token").isNotEmpty())
                    .andExpect(jsonPath("$.username").value("authuser1"))
                    .andExpect(jsonPath("$.role").value("USER"));
        }

        @Test
        @DisplayName("Auth 2: Duplicate username/email returns 409 and invalid input returns 400")
        void registerDuplicateAndInvalidInputFails() throws Exception {
            registerUser("dupuser", "dup@01blog.com", "password123");

            // Duplicate username/email -> 409 Conflict
            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"username\":\"dupuser\",\"email\":\"dup@01blog.com\",\"password\":\"password123\"}"))
                    .andExpect(status().isConflict());

            // Invalid payload -> 400 Bad Request
            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"username\":\"a!\",\"email\":\"bad-email\",\"password\":\"123\"}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.validationErrors").exists());
        }

        @Test
        @DisplayName("Auth 3 (Security): User cannot self-assign ADMIN role during registration")
        void userCannotEscalateRoleDuringRegistration() throws Exception {
            MvcResult res = mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"username\":\"hacker\",\"email\":\"hacker@01blog.com\",\"password\":\"password123\",\"role\":\"ADMIN\"}"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.role").value("USER"))
                    .andReturn();

            String hackerToken = extractToken(res.getResponse().getContentAsString());

            // Verify the registered user still gets 403 Forbidden on admin routes
            mockMvc.perform(get("/api/admin/users")
                            .header("Authorization", "Bearer " + hackerToken))
                    .andExpect(status().isForbidden());
        }
    }

    // =========================================================================
    // 2. Security & Privilege Escalation Tests (JwtService & Filters)
    // =========================================================================
    @Nested
    @DisplayName("2. Security & Privilege Escalation Tests")
    class SecurityAndPrivilegeTests {

        @Test
        @DisplayName("Security 1: Unauthenticated and forged JWT tokens are rejected with 401")
        void unauthenticatedAndForgedTokensRejected() throws Exception {
            mockMvc.perform(get("/api/auth/me"))
                    .andExpect(status().isUnauthorized());

            mockMvc.perform(get("/api/posts/feed")
                            .header("Authorization", "Bearer forged.jwt.token"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("Security 2: Ordinary user is blocked (403) from all Admin privilege operations")
        void regularUserCannotPerformAdminActions() throws Exception {
            String normalUserToken = registerAndGetToken("normaluser", "normal@01blog.com");
            Long targetId = registerAndGetId("victimuser", "victim@01blog.com");

            // Try to view all users as normal user -> 403
            mockMvc.perform(get("/api/admin/users")
                            .header("Authorization", "Bearer " + normalUserToken))
                    .andExpect(status().isForbidden());

            // Try to view admin reports -> 403
            mockMvc.perform(get("/api/admin/reports")
                            .header("Authorization", "Bearer " + normalUserToken))
                    .andExpect(status().isForbidden());

            // Try to ban another user -> 403
            mockMvc.perform(patch("/api/admin/users/" + targetId + "/ban?banned=true")
                            .header("Authorization", "Bearer " + normalUserToken))
                    .andExpect(status().isForbidden());

            // Try to delete another user via admin endpoint -> 403
            mockMvc.perform(delete("/api/admin/users/" + targetId)
                            .header("Authorization", "Bearer " + normalUserToken))
                    .andExpect(status().isForbidden());
        }
    }

    // =========================================================================
    // 3. UserService & Subscription Tests
    // =========================================================================
    @Nested
    @DisplayName("3. UserService & Subscription Tests")
    class UserServiceTests {

        @Test
        @DisplayName("User 1: Subscribe, verify follower counts on public profile, and unsubscribe")
        void subscribeAndUnsubscribeFlow() throws Exception {
            String userAToken = registerAndGetToken("subUserA", "suba@01blog.com");
            Long userBId = registerAndGetId("subUserB", "subb@01blog.com");

            // Subscribe A -> B
            mockMvc.perform(post("/api/users/" + userBId + "/subscribe")
                            .header("Authorization", "Bearer " + userAToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.followersCount").value(1))
                    .andExpect(jsonPath("$.subscribedByCurrentUser").value(true));

            // Unsubscribe A -> B
            mockMvc.perform(delete("/api/users/" + userBId + "/subscribe")
                            .header("Authorization", "Bearer " + userAToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.followersCount").value(0))
                    .andExpect(jsonPath("$.subscribedByCurrentUser").value(false));
        }

        @Test
        @DisplayName("User 2: Prevent self-subscription (400) and duplicate subscription (409)")
        void preventSelfAndDuplicateSubscription() throws Exception {
            MvcResult userARes = registerUser("selfSubUser", "selfsub@01blog.com", "password123");
            String userAToken = extractToken(userARes.getResponse().getContentAsString());
            Long userAId = extractId(userARes.getResponse().getContentAsString());
            Long userBId = registerAndGetId("targetSubUser", "targetsub@01blog.com");

            // Self-subscription -> 400 Bad Request
            mockMvc.perform(post("/api/users/" + userAId + "/subscribe")
                            .header("Authorization", "Bearer " + userAToken))
                    .andExpect(status().isBadRequest());

            // First subscription -> 200 OK
            mockMvc.perform(post("/api/users/" + userBId + "/subscribe")
                            .header("Authorization", "Bearer " + userAToken))
                    .andExpect(status().isOk());

            // Duplicate subscription -> 409 Conflict
            mockMvc.perform(post("/api/users/" + userBId + "/subscribe")
                            .header("Authorization", "Bearer " + userAToken))
                    .andExpect(status().isConflict());
        }
    }

    // =========================================================================
    // 4. PostService & MediaStorageService Tests
    // =========================================================================
    @Nested
    @DisplayName("4. PostService & MediaStorageService Tests")
    class PostAndMediaServiceTests {

        @Test
        @DisplayName("Post/Media 1: Create post with valid image and video uploads")
        void createPostWithImageAndVideoSuccess() throws Exception {
            String token = registerAndGetToken("poster1", "poster1@01blog.com");

            MockMultipartFile imageFile = new MockMultipartFile(
                    "file", "photo.png", "image/png", new byte[]{(byte) 0x89, 'P', 'N', 'G'});

            mockMvc.perform(multipart("/api/posts")
                            .file(imageFile)
                            .param("content", "Post with PNG image")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.mediaType").value("IMAGE"))
                    .andExpect(jsonPath("$.mediaUrl").isNotEmpty());

            MockMultipartFile videoFile = new MockMultipartFile(
                    "file", "clip.mp4", "video/mp4", new byte[]{0, 0, 0, 24, 'f', 't', 'y', 'p'});

            mockMvc.perform(multipart("/api/posts")
                            .file(videoFile)
                            .param("content", "Post with MP4 video")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.mediaType").value("VIDEO"));
        }

        @Test
        @DisplayName("Post/Media 2: Reject executable file upload (400) and empty post content (400)")
        void rejectInvalidMediaAndEmptyPost() throws Exception {
            String token = registerAndGetToken("poster2", "poster2@01blog.com");

            MockMultipartFile exeFile = new MockMultipartFile(
                    "file", "malware.exe", "application/x-msdownload", "MZ-exploit".getBytes());

            mockMvc.perform(multipart("/api/posts")
                            .file(exeFile)
                            .param("content", "Malicious file upload attempt")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isBadRequest());

            mockMvc.perform(multipart("/api/posts")
                            .param("content", "   ")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Post/Media 3 (Security): User cannot edit or delete another user's post (403)")
        void enforcePostOwnershipOnEditAndDelete() throws Exception {
            String ownerToken = registerAndGetToken("postOwner", "owner@01blog.com");
            String attackerToken = registerAndGetToken("postAttacker", "attacker@01blog.com");

            Long postId = createPostAndGetId(ownerToken, "Owner original content");

            // Attacker tries to edit owner's post -> 403 Forbidden
            mockMvc.perform(multipart("/api/posts/" + postId)
                            .with(req -> { req.setMethod("PUT"); return req; })
                            .param("content", "Hijacked content")
                            .header("Authorization", "Bearer " + attackerToken))
                    .andExpect(status().isForbidden());

            // Attacker tries to delete owner's post -> 403 Forbidden
            mockMvc.perform(delete("/api/posts/" + postId)
                            .header("Authorization", "Bearer " + attackerToken))
                    .andExpect(status().isForbidden());
        }
    }

    // =========================================================================
    // 5. InteractionService Tests (Likes & Comments)
    // =========================================================================
    @Nested
    @DisplayName("5. InteractionService Tests")
    class InteractionServiceTests {

        @Test
        @DisplayName("Interaction 1: Like post, block duplicate like (409), and unlike post")
        void likeDuplicateAndUnlikeFlow() throws Exception {
            String token = registerAndGetToken("liker1", "liker1@01blog.com");
            Long postId = createPostAndGetId(token, "Post to like");

            // First like -> 200 OK (likesCount = 1)
            mockMvc.perform(post("/api/posts/" + postId + "/like")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.likesCount").value(1))
                    .andExpect(jsonPath("$.likedByCurrentUser").value(true));

            // Duplicate like -> 409 Conflict
            mockMvc.perform(post("/api/posts/" + postId + "/like")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isConflict());

            // Unlike -> 200 OK (likesCount = 0)
            mockMvc.perform(delete("/api/posts/" + postId + "/like")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.likesCount").value(0));
        }

        @Test
        @DisplayName("Interaction 2: Add comment and block unauthorized comment deletion (403)")
        void commentCreationAndOwnershipProtection() throws Exception {
            String user1Token = registerAndGetToken("commenter1", "c1@01blog.com");
            String user2Token = registerAndGetToken("commenter2", "c2@01blog.com");
            Long postId = createPostAndGetId(user1Token, "Discussion post");

            // user1 adds a comment
            MvcResult commentRes = mockMvc.perform(post("/api/posts/" + postId + "/comments")
                            .header("Authorization", "Bearer " + user1Token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"content\":\"My comment\"}"))
                    .andExpect(status().isCreated())
                    .andReturn();

            Long commentId = extractId(commentRes.getResponse().getContentAsString());

            // user2 (neither comment author nor post author) cannot delete user1's comment -> 403
            mockMvc.perform(delete("/api/comments/" + commentId)
                            .header("Authorization", "Bearer " + user2Token))
                    .andExpect(status().isForbidden());
        }
    }

    // =========================================================================
    // 6. NotificationService Tests
    // =========================================================================
    @Nested
    @DisplayName("6. NotificationService Tests")
    class NotificationServiceTests {

        @Test
        @DisplayName("Notification 1: Publishing post notifies subscribers but NOT non-subscribers")
        void notifySubscribersOnly() throws Exception {
            String subscriberToken = registerAndGetToken("subListener", "subl@01blog.com");
            String outsiderToken = registerAndGetToken("outsider", "out@01blog.com");

            MvcResult authorRes = registerUser("publisher", "pub@01blog.com", "password123");
            String authorToken = extractToken(authorRes.getResponse().getContentAsString());
            Long authorId = extractId(authorRes.getResponse().getContentAsString());

            // subscriber subscribes to publisher
            mockMvc.perform(post("/api/users/" + authorId + "/subscribe")
                            .header("Authorization", "Bearer " + subscriberToken))
                    .andExpect(status().isOk());

            // publisher creates a post
            createPostAndGetId(authorToken, "New post triggering notification");

            // Subscriber has unreadCount = 1
            mockMvc.perform(get("/api/notifications/unread-count")
                            .header("Authorization", "Bearer " + subscriberToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.unreadCount").value(1));

            // Outsider has unreadCount = 0
            mockMvc.perform(get("/api/notifications/unread-count")
                            .header("Authorization", "Bearer " + outsiderToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.unreadCount").value(0));
        }

        @Test
        @DisplayName("Notification 2 (Security): User cannot mark another user's notification as read (403)")
        void preventCrossUserNotificationModification() throws Exception {
            String subscriberToken = registerAndGetToken("notifOwner", "no@01blog.com");
            String attackerToken = registerAndGetToken("notifAttacker", "na@01blog.com");

            MvcResult authorRes = registerUser("notifAuthor", "nauth@01blog.com", "password123");
            String authorToken = extractToken(authorRes.getResponse().getContentAsString());
            Long authorId = extractId(authorRes.getResponse().getContentAsString());

            mockMvc.perform(post("/api/users/" + authorId + "/subscribe")
                            .header("Authorization", "Bearer " + subscriberToken))
                    .andExpect(status().isOk());

            createPostAndGetId(authorToken, "Post for notification security test");

            MvcResult listRes = mockMvc.perform(get("/api/notifications")
                            .header("Authorization", "Bearer " + subscriberToken))
                    .andExpect(status().isOk())
                    .andReturn();

            Long notificationId = extractId(listRes.getResponse().getContentAsString());

            // Attacker tries to mark subscriber's notification as read -> 403 Forbidden
            mockMvc.perform(patch("/api/notifications/" + notificationId + "/read?read=true")
                            .header("Authorization", "Bearer " + attackerToken))
                    .andExpect(status().isForbidden());

            // Owner marks their own notification as read -> 200 OK
            mockMvc.perform(patch("/api/notifications/" + notificationId + "/read?read=true")
                            .header("Authorization", "Bearer " + subscriberToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.read").value(true));
        }
    }

    // =========================================================================
    // 7. ModerationService & Admin Tests
    // =========================================================================
    @Nested
    @DisplayName("7. ModerationService & Admin Tests")
    class ModerationServiceTests {

        @Test
        @DisplayName("Moderation 1: User submits report (201) and self-reporting is blocked (400)")
        void submitReportAndPreventSelfReport() throws Exception {
            MvcResult reporterRes = registerUser("reporter1", "rep1@01blog.com", "password123");
            String reporterToken = extractToken(reporterRes.getResponse().getContentAsString());
            Long reporterId = extractId(reporterRes.getResponse().getContentAsString());
            Long reportedId = registerAndGetId("badActor", "bad@01blog.com");

            // Valid report -> 201 Created
            mockMvc.perform(post("/api/users/" + reportedId + "/report")
                            .header("Authorization", "Bearer " + reporterToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"reason\":\"Spamming inappropriate links\"}"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.reason").value("Spamming inappropriate links"));

            // Self-report -> 400 Bad Request
            mockMvc.perform(post("/api/users/" + reporterId + "/report")
                            .header("Authorization", "Bearer " + reporterToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"reason\":\"Trying to report myself\"}"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Moderation 2: Admin bans user, banned user cannot log in (403), and Admin cannot self-ban (400)")
        void adminBanFlowAndSelfBanProtection() throws Exception {
            String adminToken = loginAsAdmin();
            Long targetId = registerAndGetId("bannableUser", "banme@01blog.com");

            // Admin bans target user -> 200 OK
            mockMvc.perform(patch("/api/admin/users/" + targetId + "/ban?banned=true")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.banned").value(true));

            // Banned user tries to log in -> 403 Forbidden
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"usernameOrEmail\":\"bannableUser\",\"password\":\"password123\"}"))
                    .andExpect(status().isForbidden());

            // Admin cannot ban their own account (id=1) -> 400 Bad Request
            mockMvc.perform(patch("/api/admin/users/1/ban?banned=true")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Moderation 3: Admin hides post from public view and deletes user cleanly")
        void adminHidePostAndDeleteUser() throws Exception {
            String adminToken = loginAsAdmin();
            MvcResult userRes = registerUser("tempAuthor", "temp@01blog.com", "password123");
            String userToken = extractToken(userRes.getResponse().getContentAsString());
            Long userId = extractId(userRes.getResponse().getContentAsString());

            Long postId = createPostAndGetId(userToken, "Post that will be hidden by admin");

            // Admin hides the post
            mockMvc.perform(patch("/api/admin/posts/" + postId + "/hide?hide=true")
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.hidden").value(true));

            // Regular user can no longer view the hidden post -> 404 Not Found
            mockMvc.perform(get("/api/posts/" + postId)
                            .header("Authorization", "Bearer " + userToken))
                    .andExpect(status().isNotFound());

            // Admin deletes the user and all associated data cleanly -> 200 OK
            mockMvc.perform(delete("/api/admin/users/" + userId)
                            .header("Authorization", "Bearer " + adminToken))
                    .andExpect(status().isOk());
        }
    }

    // =========================================================================
    // Helper Methods
    // =========================================================================
    private MvcResult registerUser(String username, String email, String password) throws Exception {
        return mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format(
                                "{\"username\":\"%s\",\"email\":\"%s\",\"password\":\"%s\",\"bio\":\"Test bio\"}",
                                username, email, password)))
                .andExpect(status().isCreated())
                .andReturn();
    }

    private String registerAndGetToken(String username, String email) throws Exception {
        MvcResult res = registerUser(username, email, "password123");
        return extractToken(res.getResponse().getContentAsString());
    }

    private Long registerAndGetId(String username, String email) throws Exception {
        MvcResult res = registerUser(username, email, "password123");
        return extractId(res.getResponse().getContentAsString());
    }

    private Long createPostAndGetId(String token, String content) throws Exception {
        MvcResult res = mockMvc.perform(multipart("/api/posts")
                        .param("content", content)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated())
                .andReturn();
        return extractId(res.getResponse().getContentAsString());
    }

    private String loginAsAdmin() throws Exception {
        MvcResult res = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"usernameOrEmail\":\"admin\",\"password\":\"admin123\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return extractToken(res.getResponse().getContentAsString());
    }

    private String extractToken(String json) {
        return json.replaceAll(".*\"token\":\"([^\"]+)\".*", "$1");
    }

    private Long extractId(String json) {
        return Long.parseLong(json.replaceFirst(".*?\"id\":(\\d+).*", "$1"));
    }
}
