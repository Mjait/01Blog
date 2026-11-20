# 🧶 Woob (01Blog) — Fullstack Technical Specification & Architecture

A social and editorial blogging platform built with **Spring Boot 3.x** and **Angular 22 (Zoneless & Signal-based)**. Woob implements a masculine, editorial aesthetic (Midnight Slate, Steel Indigo, Bronze/Gold highlights), strict visual feedback standards, mandatory confirmation dialogs for destructive actions, and a scalable administration architecture.

---

## 1. System Overview & Monorepo Structure

```text
01blog/
├── BACKEND_REFERENCE.md              # Standalone API Quick Reference
├── README.md                          # Project Overview & Quickstart
├── backend/                           # Spring Boot 3.x Backend Service
│   ├── pom.xml
│   ├── uploads/                       # Local Multipart File Storage
│   └── src/main/java/com/jait/_Blog/
│       ├── config/                    # Security, JWT, CORS, WebMvc Configuration
│       ├── exception/                 # Global API Exception Handling
│       ├── user/                      # User, Role, Profile & Subscription Domain
│       ├── post/                      # Posts, Media Attachments, Likes & Comments
│       ├── notification/              # Notification Event Generation & Query
│       └── admin/                     # Administrative Governance & Moderation
└── frontend/                          # Angular 22 Single Page Application
    ├── package.json
    ├── angular.json
    ├── tsconfig.json
    └── src/
        ├── styles.scss                # Global Editorial CSS Tokens & Theme Variables
        ├── main.ts                    # Client Entrypoint (Zoneless Bootstrap)
        ├── main.server.ts             # Server Entrypoint
        └── app/
            ├── app.config.ts          # Zoneless Providers & Interceptors
            ├── app.routes.ts          # Route Registry & Guard Configuration
            ├── app.routes.server.ts   # Client Render Mode Configuration for SSR
            ├── core/
            │   ├── guards/            # authGuard & adminGuard (SSR-safe)
            │   ├── interceptors/      # jwt.interceptor.ts
            │   └── services/          # auth, api, post, user, admin, notification
            ├── shared/
            │   ├── components/        # navbar, confirm-dialog, report-modal
            │   └── services/          # feedback.service.ts (Snackbar & Dialogs)
            └── features/
                ├── auth/              # login & register components
                ├── feed/              # community-feed (Dual-mode, Media Previews)
                ├── profile/           # user-profile (Public/Personal Block, Inline CRUD)
                └── admin/             # admin-dashboard (Scalable 3-Tab Moderation)
```

---

## 2. Backend Specification (Spring Boot 3.x)

### 2.1 Security & Authentication Architecture

- **Stateless JWT**: Authentication uses Bearer tokens (`io.jsonwebtoken`) validated on every request via `JwtAuthenticationFilter`.
- **Password Encryption**: `BCryptPasswordEncoder` handles hashing and validation.
- **Account Enforcement**:
  - Users flagged with `banned = true` cannot log in; authentication endpoints return `403 Forbidden` (`"Account banned"`).
  - Admins cannot ban their own account (`400 Bad Request`).
- **Media Storage**: Uploaded images and videos are written to disk under `/uploads/{uuid}.{ext}` and served as static resources via `WebMvcConfigurer`.

### 2.2 Core Domain Models & Relationships

```text
+-----------------------------------------------------------+
|                           User                            |
+-----------------------------------------------------------+
| id: Long (PK)                                             |
| username: String (Unique)                                 |
| email: String (Unique)                                    |
| password: String (BCrypt)                                 |
| bio: String                                               |
| avatarUrl: String                                         |
| role: Role (USER, ADMIN)                                  |
| banned: boolean (default false)                           |
| createdAt / updatedAt: Instant                            |
+-----------------------------------------------------------+
       | 1             | 1             | 1             | 1
       |               |               |               |
       v *             v *             v *             v *
+---------------+---------------+---------------+---------------+
|     Post      |    Comment    |     Like      | Subscription  |
+---------------+---------------+---------------+---------------+
| id: Long (PK) | id: Long (PK) | id: Long (PK) | id: Long (PK) |
| author: User  | post: Post    | post: Post    | subscriber: U |
| content: Text | author: User  | user: User    | target: User  |
| mediaUrl: Str | content: Text | createdAt     | createdAt     |
| mediaType: E  | createdAt     +---------------+---------------+
| hidden: bool  +---------------+
| createdAt     |
+---------------+
       | 1
       v *
+-----------------------------------+
|              Report               |
+-----------------------------------+
| id: Long (PK)                     |
| reporter: User                    |
| reportedUser: User                |
| reportedPost: Post (Nullable)     |
| reason: String                    |
| status: Enum                      |
| (PENDING, RESOLVED, DISMISSED)    |
| createdAt: Instant                |
+-----------------------------------+
```

### 2.3 REST API Endpoints

#### Authentication (`/api/auth`)

| Method | Endpoint | Access | Body / Params | Expected Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | `{ username, email, password, bio? }` | `201 Created` + `AuthResponse` |
| `POST` | `/api/auth/login` | Public | `{ usernameOrEmail, password }` | `200 OK` + `AuthResponse` (or `403` if banned) |

#### Posts & Community Feed (`/api/posts`)

| Method | Endpoint | Access | Body / Params | Expected Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/posts` | Auth | None | `200 OK` + `List<PostResponse>` (`hidden=false`) |
| `GET` | `/api/posts/feed` | Auth | None | `200 OK` + `List<PostResponse>` (subscribed creators) |
| `POST` | `/api/posts` | Auth | Multipart: `content`, `file?` | `201 Created` + `PostResponse` |
| `PUT` | `/api/posts/{id}` | Owner | Multipart: `content`, `file?` | `200 OK` + `PostResponse` |
| `DELETE` | `/api/posts/{id}` | Owner/Admin | Path: `id` | `204 No Content` |
| `POST` | `/api/posts/{id}/like` | Auth | Path: `id` | `200 OK` + `PostResponse` (likesCount incremented) |
| `DELETE` | `/api/posts/{id}/like` | Auth | Path: `id` | `200 OK` + `PostResponse` (likesCount decremented) |

#### Comments (`/api/posts/{id}/comments` & `/api/comments/{id}`)

| Method | Endpoint | Access | Body / Params | Expected Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/posts/{id}/comments` | Auth | Path: `id` | `200 OK` + `List<CommentItem>` |
| `POST` | `/api/posts/{id}/comments` | Auth | `{ content }` | `201 Created` + `CommentItem` |
| `DELETE` | `/api/comments/{id}` | Author/Owner/Admin | Path: `id` | `204 No Content` |

#### Users, Profiles & Subscriptions (`/api/users`)

| Method | Endpoint | Access | Body / Params | Expected Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/users/{id}` | Auth | Path: `id` | `200 OK` + `UserProfile` |
| `GET` | `/api/users/{id}/posts` | Auth | Path: `id` | `200 OK` + `List<PostResponse>` (`author=id`, `hidden=false`) |
| `POST` | `/api/users/{id}/subscribe` | Auth | Path: `id` | `200 OK` + `UserProfile` (`subscribedByCurrentUser=true`) |
| `DELETE` | `/api/users/{id}/subscribe` | Auth | Path: `id` | `200 OK` + `UserProfile` (`subscribedByCurrentUser=false`) |
| `POST` | `/api/users/{id}/report` | Auth | `{ reason, reportedPostId? }` | `201 Created` + `ReportResponse` |

#### Notifications (`/api/notifications`)

| Method | Endpoint | Access | Body / Params | Expected Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Auth | None | `200 OK` + `List<NotificationItem>` |
| `GET` | `/api/notifications/unread-count` | Auth | None | `200 OK` + `{ "unreadCount": number }` |
| `PATCH` | `/api/notifications/{id}/read` | Auth | `?read=true` or `false` | `200 OK` + `NotificationItem` |
| `PATCH` | `/api/notifications/read-all` | Auth | None | `204 No Content` |

#### Admin Governance & Moderation (`/api/admin`)

*Requires `ROLE_ADMIN`.*

| Method | Endpoint | Query / Payload | Behavior & Validation |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/users` | None | Lists all users with counts, roles, and `banned` status. |
| `PATCH` | `/api/admin/users/{id}/ban` | `?banned=true` or `false` | Sets ban flag. Returns `400` if target is current admin. |
| `DELETE` | `/api/admin/users/{id}` | Path: `id` | Cascades user, content, likes, comments, and reports. |
| `GET` | `/api/admin/reports` | None | Lists reports across all statuses (`PENDING`, `RESOLVED`, `DISMISSED`). |
| `PATCH` | `/api/admin/reports/{id}` | `?status=RESOLVED` or `DISMISSED` | Resolves or dismisses a moderation report. |
| `GET` | `/api/admin/posts` | None | Lists all posts (including `hidden = true`). |
| `PATCH` | `/api/admin/posts/{id}/hide` | `?hidden=true` or `false` | Toggles post visibility in public and subscribed feeds. |
| `DELETE` | `/api/admin/posts/{id}` | Path: `id` | Deletes any post platform-wide. |

---

## 3. Frontend Specification (Angular 22)

### 3.1 Design Tokens & Theming (`src/styles.scss`)

```scss
:root {
  --bg-primary: #121118;            // Deep Midnight Slate Base
  --bg-card: #1E1B24;               // Charcoal Slate Container
  --text-main: #F7F5F0;             // Parchment Cream
  --text-muted: #A09BA8;            // Muted Slate
  --accent-primary: #4A4363;        // Muted Steel Indigo
  --accent-primary-hover: #5D547D;
  --accent-gold: #C8A951;           // Luxury Bronze/Gold Accent
  --accent-gold-hover: #D4B965;
  --border-subtle: #2E2A37;         // Structural Dividers
  --danger: #9E3B3B;                // Crimson for Destructive Actions
  --danger-hover: #B54545;
  --success: #3E7B54;               // Forest Muted Green
}
```

### 3.2 Routing & SSR Hydration Configuration

#### Client-Only Rendering for Dynamic Routes (`app.routes.server.ts`)

Prevent SSR node hydration conflicts with local storage JWTs by forcing client rendering:

```typescript
import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '**', renderMode: RenderMode.Client }
];
```

#### SSR-Safe Auth & Admin Guards (`core/guards/auth.guard.ts`)

Guards check `isPlatformBrowser(platformId)` to allow SSR passes during bootstrap while enforcing route security in the browser:

```typescript
export const authGuard: CanActivateFn = () => {
  const platformId = inject(PLATFORM_ID);
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!isPlatformBrowser(platformId)) return true;
  if (authService.isAuthenticated()) return true;

  router.navigate(['/login']);
  return false;
};
```

---

## 4. Key Components & Implementation Patterns

### 4.1 Navbar Component (`NavbarComponent`)

- Mascot logo badge (🧶 Woob) linking to `/feed`.
- Global search input.
- Dynamic notification bell displaying real-time unread count badges.
- Notification dropdown drawer with unread dot indicators, individual read toggling, and "Mark all read" capabilities.
- User profile badge and confirmation-backed logout modal.

### 4.2 Community Feed (`CommunityFeedComponent`)

- **State Management**: Built on Angular Signals (`signal<PostItem[]>`, `signal<boolean>`) for immediate UI updates.
- **Dual-Feed Switcher**:
  - `🌐 Explore All`: Calls `/api/posts` for global community posts.
  - `🏠 Subscribed Feed`: Calls `/api/posts/feed` for posts from followed creators.
- **Publisher Card**:
  - Multi-line input area.
  - Local media picker with instant pre-submission image/video preview box and single-click attachment removal.
- **Interactive Post Card**:
  - Real-time like counter toggle.
  - Inline comment list expansion, comment submission, and author/admin comment deletion.
  - Post deletion (owner/admin) gated behind `ConfirmDialogComponent`.
  - Post reporting gated behind `ReportModalComponent`.

### 4.3 Profile / Block Component (`UserProfileComponent`)

- **Knit-Patterned Banner**: Generated with CSS linear gradients.
- **Profile Header**: Avatar, username, bio, follower/following/post stats line.
- **Subscription Management**: Immediate follow/unfollow toggle with feedback toasts.
- **Personal Block Controls**:
  - When viewing own profile: Displays post publisher and inline post editor.
  - Supports loading existing post content, swapping media, and sending `PUT` updates.
- **Public Block Controls**:
  - When viewing other creators: Displays follow button and "Report User" button opening `ReportModalComponent`.

### 4.4 Admin Moderation Dashboard (`AdminDashboardComponent`)

Designed specifically to prevent browser lag when scaling to hundreds of thousands of posts:

#### Tab 1: Reports Triage Queue (`activeTab = 'reports'`)

Contextual actions dynamically align with the report type:

- **Post Reports (`reportedPostId != null`)**:
  - `👁️ Inspect`: Opens an inline drawer previewing the exact post content, media, and author without leaving the dashboard.
  - `🙈 Hide Post / 👁️ Unhide Post`: Toggles the post's platform-wide visibility (`PATCH /api/admin/posts/{id}/hide?hidden=true/false`).
  - `🗑️ Delete Post`: Permanently deletes the reported post.
- **User Reports (`reportedPostId == null`)**:
  - `🚫 Ban User / ✓ Unban User`: Directly updates account ban state (`PATCH /api/admin/users/{id}/ban?banned=true/false`).
- **Status Updates**: Explicit `Resolve` and `Dismiss` actions update the report entity.

#### Tab 2: Users Directory (`activeTab = 'users'`)

- Search accounts by `@username` or email address.
- Status filters (`All`, `Banned`, `Active`).
- Account actions: Ban / Unban user, Delete account permanently.

#### Tab 3: Moderated Posts & On-Demand Lookup (`activeTab = 'posts'`)

- **Scalable Approach**: Does not render millions of public posts by default.
- Shows currently **Hidden Posts** by default so admins can quickly unhide or inspect them.
- Provides an **On-Demand Search Input** that queries posts by `#ID`, `@author`, or text content when moderation on a specific public item is needed.

---

## 5. Shared Modals & Feedback Architecture

### 5.1 Confirmation Dialog (`ConfirmDialogComponent`)

Every destructive administrative and user action requires explicit confirmation before triggering an HTTP call:

```typescript
feedback.confirm({
  title: 'Ban User @bob',
  message: 'Are you sure you want to ban @bob? They will be unable to log in.',
  confirmText: 'Yes, Ban',
  isDestructive: true
}).subscribe(confirmed => {
  if (confirmed) {
    adminService.banUser(userId).subscribe(...);
  }
});
```

### 5.2 Report Modal (`ReportModalComponent`)

- Custom Material dialog matching the design system.
- Minimum 5-character reason validation before enabling submission.
- Secondary confirmation modal before transmitting the report to `/api/users/{id}/report`.

---

## 6. Critical Engineering Fixes Applied

### Issue 1: SSR Page Refresh Redirects to Login

- **Root Cause**: `authGuard` executed on the server where `localStorage` was inaccessible (`typeof window === 'undefined'`), evaluating `isAuthenticated()` to `false` and redirecting client requests to `/login`.
- **Fix**: Added `isPlatformBrowser(platformId)` check to `authGuard` and set `renderMode: RenderMode.Client` in `app.routes.server.ts`.

### Issue 2: Post List Delayed Rendering

- **Root Cause**: Angular 22 zoneless change detection did not automatically trigger re-renders on async RxJS `.subscribe()` callbacks when plain component fields were mutated.
- **Fix**: Refactored `CommunityFeedComponent` and `AdminDashboardComponent` state to use Angular **Signals** (`signal()`, `computed()`), ensuring instantaneous UI rendering upon HTTP completion.

### Issue 3: Admin Unban Endpoint 500 Error

- **Root Cause**: The frontend initially called a non-existent `/api/admin/users/{id}/unban` route.
- **Fix**: Aligned with Spring Boot controller signature to pass the boolean query parameter:
  - Ban: `PATCH /api/admin/users/{id}/ban?banned=true`
  - Unban: `PATCH /api/admin/users/{id}/ban?banned=false`

### Issue 4: Admin Content Overload at Scale

- **Root Cause**: Fetching and rendering every post across the platform inside an admin dashboard creates memory bottlenecks on large datasets.
- **Fix**: Replaced the global post list with a 3-tab layout containing an On-Demand Post Lookup, rendering only currently moderated/hidden posts by default, and isolating contextual actions based on whether a report targets a post or an account profile.

---

## 7. Verification & Testing Suite

Execute the following `curl` suite against a running backend instance (`http://localhost:8080`) to verify all core security rules and moderation controls:

```bash
# 1. Register User
curl -i -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"bob","email":"bob@01blog.com","password":"password123","bio":"Crochet creator"}'

# 2. Login to retrieve Token
BOB_TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"bob","password":"password123"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# 3. Create Post with Media
curl -i -X POST http://localhost:8080/api/posts \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -F "content=Hello Woob community! First post." \
  -F "file=@test-image.png"

# 4. Admin Bans User (userId = 3)
curl -i -X PATCH "http://localhost:8080/api/admin/users/3/ban?banned=true" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 5. Verify Banned User Cannot Login (Expected: 403 Forbidden)
curl -i -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"bob","password":"password123"}'

# 6. Admin Unbans User (userId = 3)
curl -i -X PATCH "http://localhost:8080/api/admin/users/3/ban?banned=false" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 7. Prevent Admin Self-Ban (Expected: 400 Bad Request)
curl -i -X PATCH "http://localhost:8080/api/admin/users/1/ban?banned=true" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```