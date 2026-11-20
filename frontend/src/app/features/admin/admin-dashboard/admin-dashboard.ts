import { Component, inject, OnInit, PLATFORM_ID, signal, computed } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { AdminService, AdminUserItem, ReportItem } from '../../../core/services/admin.service';
import { PostItem } from '../../../core/services/post.service';
import { FeedbackService } from '../../../shared/services/feedback.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="admin-container">
      <!-- Top Crown Banner -->
      <div class="admin-banner woob-card">
        <div class="banner-title">
          <span>👑</span>
          <h1>ADMIN MODERATION CENTER</h1>
          <span>👑</span>
        </div>
        <p>Scalable governance — contextual report actions & mandatory confirmation dialogs</p>
      </div>

      <!-- Analytics Overview Cards (Bonus Requirement: Basic Analytics) -->
      <div class="analytics-grid">
        <div class="stat-card woob-card" (click)="activeTab.set('reports')">
          <span class="stat-label">Pending Reports</span>
          <strong class="stat-value highlight-danger">{{ pendingReportsCount() }}</strong>
          <span class="stat-trend">🚩 {{ reports().length }} total reports</span>
        </div>

        <div class="stat-card woob-card" (click)="activeTab.set('users')">
          <span class="stat-label">Registered Users</span>
          <strong class="stat-value">{{ users().length }}</strong>
          <span class="stat-trend">🚫 {{ bannedUsersCount() }} currently banned</span>
        </div>

        <div class="stat-card woob-card" (click)="activeTab.set('posts')">
          <span class="stat-label">Platform Posts</span>
          <strong class="stat-value highlight-gold">{{ posts().length }}</strong>
          <span class="stat-trend">🙈 {{ hiddenPostsCount() }} hidden posts</span>
        </div>

        <div class="stat-card woob-card most-reported-card" (click)="activeTab.set('reports')">
          <span class="stat-label">Most Reported Creators</span>
          <div class="reported-leaderboard" *ngIf="mostReportedUsers().length > 0; else noReported">
            <span *ngFor="let m of mostReportedUsers()" class="leader-pill">
              @{{ m.username }} ({{ m.count }})
            </span>
          </div>
          <ng-template #noReported>
            <span class="stat-trend">✓ Clean record, 0 reports</span>
          </ng-template>
        </div>
      </div>

      <!-- Pro Navigation Tabs -->
      <div class="admin-tabs">
        <button 
          class="tab-btn" 
          [class.active]="activeTab() === 'reports'" 
          (click)="activeTab.set('reports')">
          🚩 Reports Queue ({{ pendingReportsCount() }})
        </button>
        <button 
          class="tab-btn" 
          [class.active]="activeTab() === 'users'" 
          (click)="activeTab.set('users')">
          👥 Users Directory
        </button>
        <button 
          class="tab-btn" 
          [class.active]="activeTab() === 'posts'" 
          (click)="activeTab.set('posts')">
          🙈 Moderated Posts & Lookup ({{ hiddenPostsCount() }})
        </button>
      </div>

      <!-- ========================================================= -->
      <!-- TAB 1: REPORTED CONTENT & USERS (CONTEXTUAL ACTIONS)      -->
      <!-- ========================================================= -->
      <div class="section-card woob-card" *ngIf="activeTab() === 'reports'">
        <div class="section-header">
          <div>
            <h2>🚩 Reports Triage Queue</h2>
            <p class="section-sub">Post reports show post moderation controls (Hide/Delete). User reports show account controls (Ban).</p>
          </div>

          <div class="filter-pills">
            <button [class.active]="reportFilter() === 'ALL'" (click)="reportFilter.set('ALL')">All</button>
            <button [class.active]="reportFilter() === 'PENDING'" (click)="reportFilter.set('PENDING')">Pending</button>
            <button [class.active]="reportFilter() === 'POSTS'" (click)="reportFilter.set('POSTS')">🧵 Post Reports</button>
            <button [class.active]="reportFilter() === 'USERS'" (click)="reportFilter.set('USERS')">👤 User Reports</button>
          </div>
        </div>

        <!-- Inline Inspected Post Preview Box -->
        <div class="inspected-post-box" *ngIf="inspectedPost() as p">
          <div class="inspect-header">
            <strong>👁️ Inspecting Post #{{ p.id }} by @{{ p.authorUsername }}</strong>
            <button class="close-inspect" (click)="inspectedPost.set(null)">✕ Close Preview</button>
          </div>
          <p class="inspect-content">{{ p.content }}</p>
          <img *ngIf="p.mediaUrl && p.mediaType === 'IMAGE'" [src]="'http://localhost:8080' + p.mediaUrl" alt="Reported media" />
          <div class="inspect-meta">
            Visibility: <strong>{{ p.hidden ? '🙈 HIDDEN' : '🌐 PUBLIC' }}</strong> • Created: {{ p.createdAt | date:'medium' }}
          </div>
        </div>

        <div class="table-responsive">
          <table class="woob-table">
            <thead>
              <tr>
                <th>Reported User</th>
                <th>Reported By</th>
                <th>Reason</th>
                <th>Target Type</th>
                <th>Status</th>
                <th>Contextual Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="filteredReports().length === 0">
                <td colspan="6" class="empty-row">No matching reports in queue.</td>
              </tr>
              <tr *ngFor="let r of filteredReports()">
                <td>
                  <a [routerLink]="['/profile', r.reportedUserId]" class="user-link">@{{ r.reportedUsername }}</a>
                </td>
                <td>@{{ r.reporterUsername }}</td>
                <td>{{ r.reason }}</td>
                <td>
                  <span *ngIf="r.reportedPostId" class="target-badge post-target">
                    🧵 Post #{{ r.reportedPostId }}
                  </span>
                  <span *ngIf="!r.reportedPostId" class="target-badge user-target">
                    👤 User Profile
                  </span>
                </td>
                <td>
                  <span class="status-pill" [class]="getReportStatus(r).toLowerCase()">
                    {{ getReportStatus(r) }}
                  </span>
                </td>
                <td class="actions-cell">
                  <!-- IF TARGET IS A POST: Show Inspect + Hide/Unhide Post + Delete Post -->
                  <ng-container *ngIf="r.reportedPostId; else userReportActions">
                    <button class="btn-steel btn-xs" (click)="inspectPostById(r.reportedPostId)">
                      👁️ Inspect
                    </button>
                    <button 
                      class="btn-gold btn-xs" 
                      (click)="toggleHideReportedPost(r)">
                      {{ isPostHidden(r.reportedPostId) ? '👁️ Unhide Post' : '🙈 Hide Post' }}
                    </button>
                    <button 
                      class="btn-danger btn-xs" 
                      (click)="deleteReportedPost(r)">
                      🗑️ Delete Post
                    </button>
                  </ng-container>

                  <!-- IF TARGET IS A USER PROFILE: Show Ban / Unban User -->
                  <ng-template #userReportActions>
                    <button 
                      [class]="isUserBanned(r.reportedUserId) ? 'btn-gold btn-xs' : 'btn-danger btn-xs'"
                      (click)="banOrUnbanFromReport(r)">
                      {{ isUserBanned(r.reportedUserId) ? '✓ Unban User' : '🚫 Ban User' }}
                    </button>
                  </ng-template>

                  <!-- Dismiss / Resolve Report Status -->
                  <button 
                    *ngIf="getReportStatus(r) === 'PENDING'" 
                    class="btn-steel btn-xs" 
                    (click)="updateReportStatus(r, 'DISMISSED')">
                    Dismiss
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ========================================================= -->
      <!-- TAB 2: USERS DIRECTORY (SEARCH & FILTER)                  -->
      <!-- ========================================================= -->
      <div class="section-card woob-card" *ngIf="activeTab() === 'users'">
        <div class="section-header">
          <div>
            <h2>👥 Users Directory</h2>
            <p class="section-sub">Search accounts by username or email and manage platform access.</p>
          </div>

          <div class="search-and-filter">
            <input 
              type="text" 
              class="admin-search-input" 
              [(ngModel)]="userSearchQuery" 
              placeholder="🔍 Search @username or email..." 
            />
            <div class="filter-pills">
              <button [class.active]="userFilter() === 'ALL'" (click)="userFilter.set('ALL')">All</button>
              <button [class.active]="userFilter() === 'BANNED'" (click)="userFilter.set('BANNED')">Banned</button>
              <button [class.active]="userFilter() === 'ACTIVE'" (click)="userFilter.set('ACTIVE')">Active</button>
            </div>
          </div>
        </div>

        <div class="table-responsive">
          <table class="woob-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Posts</th>
                <th>Account Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="filteredUsers().length === 0">
                <td colspan="6" class="empty-row">No users match your search.</td>
              </tr>
              <tr *ngFor="let u of filteredUsers()">
                <td>
                  <a [routerLink]="['/profile', u.id]" class="user-link">@{{ u.username }}</a>
                </td>
                <td>{{ u.email }}</td>
                <td><span class="role-tag">{{ u.role }}</span></td>
                <td>
                  <span class="status-pill" [class]="u.banned ? 'banned' : 'active'">
                    {{ u.banned ? 'BANNED' : 'ACTIVE' }}
                  </span>
                </td>
                <td>{{ u.postsCount }}</td>
                <td class="actions-cell">
                  <!-- Promote to Admin / Demote to User -->
                  <button 
                    *ngIf="u.role === 'USER' && !u.banned" 
                    class="btn-gold btn-xs" 
                    (click)="promoteToAdmin(u)">
                    👑 Make Admin
                  </button>
                  <button 
                    *ngIf="u.role === 'ADMIN' && u.id !== currentUser?.id && u.username !== 'admin'" 
                    class="btn-steel btn-xs" 
                    (click)="demoteToUser(u)">
                    Demote to User
                  </button>
                  <span *ngIf="u.role === 'ADMIN'" class="target-badge" style="background: rgba(200, 169, 81, 0.15); color: var(--accent-gold); font-size: 0.72rem;">
                    🛡️ Protected Admin
                  </span>

                  <!-- Ban / Unban User (Only non-admins) -->
                  <button 
                    *ngIf="!u.banned && u.role !== 'ADMIN'" 
                    class="btn-danger btn-xs" 
                    (click)="toggleBanUser(u)">
                    🚫 Ban
                  </button>
                  <button 
                    *ngIf="u.banned" 
                    class="btn-gold btn-xs" 
                    (click)="toggleBanUser(u)">
                    ✓ Unban
                  </button>
                  <button 
                    *ngIf="u.role !== 'ADMIN'" 
                    class="btn-danger btn-xs" 
                    (click)="deleteUser(u)">
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ========================================================= -->
      <!-- TAB 3: SCALABLE POST MODERATION (HIDDEN + ON-DEMAND LOOKUP)-->
      <!-- ========================================================= -->
      <div class="section-card woob-card" *ngIf="activeTab() === 'posts'">
        <div class="section-header">
          <div>
            <h2>🙈 Moderated Posts & On-Demand Post Lookup</h2>
            <p class="section-sub">
              Showing only currently <strong>Hidden Posts</strong> by default for high scalability. Use search to look up any specific post by #ID, @author, or keyword.
            </p>
          </div>

          <div class="search-and-filter">
            <input 
              type="text" 
              class="admin-search-input" 
              [(ngModel)]="postSearchQuery" 
              placeholder="🔍 Lookup Post #ID, @username, or keyword..." 
            />
          </div>
        </div>

        <div class="table-responsive">
          <table class="woob-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Author</th>
                <th>Content</th>
                <th>Visibility</th>
                <th>Created</th>
                <th>Post Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="moderatedOrSearchedPosts().length === 0">
                <td colspan="6" class="empty-row">
                  <span *ngIf="!postSearchQuery.trim()">No hidden posts right now. Type a Post #ID or @username above to look up a public post.</span>
                  <span *ngIf="postSearchQuery.trim()">No posts found matching "{{ postSearchQuery }}".</span>
                </td>
              </tr>
              <tr *ngFor="let p of moderatedOrSearchedPosts()">
                <td><strong>#{{ p.id }}</strong></td>
                <td>
                  <a [routerLink]="['/profile', p.authorId]" class="user-link">@{{ p.authorUsername }}</a>
                </td>
                <td class="truncate-cell">{{ p.content }}</td>
                <td>
                  <span class="status-pill" [class]="p.hidden ? 'banned' : 'active'">
                    {{ p.hidden ? '🙈 HIDDEN' : '🌐 PUBLIC' }}
                  </span>
                </td>
                <td>{{ p.createdAt | date:'short' }}</td>
                <td class="actions-cell">
                  <button 
                    [class]="p.hidden ? 'btn-gold btn-xs' : 'btn-steel btn-xs'" 
                    (click)="toggleHidePost(p)">
                    {{ p.hidden ? '👁️ Unhide Post' : '🙈 Hide Post' }}
                  </button>
                  <button class="btn-danger btn-xs" (click)="deletePost(p)">
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-container {
      max-width: 1180px;
      margin: 28px auto;
      padding: 0 16px;
      display: flex;
      flex-direction: column;
      gap: 22px;
    }
    .admin-banner {
      text-align: center;
      padding: 24px;
      background: linear-gradient(135deg, #1E1B24 0%, #302840 100%);
      border: 1px solid var(--accent-gold);
      .banner-title {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 12px;
        h1 { margin: 0; font-size: 1.45rem; letter-spacing: 1px; color: var(--accent-gold); }
      }
      p { margin: 6px 0 0; color: var(--text-muted); font-size: 0.9rem; }
    }
    .analytics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }
    .reported-leaderboard {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 4px;
    }
    .leader-pill {
      font-size: 0.8rem;
      background: rgba(158, 59, 59, 0.2);
      color: #ff8585;
      padding: 2px 6px;
      border-radius: 6px;
      font-weight: 600;
    }
    .stat-card {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      cursor: pointer;
      transition: transform 0.15s ease, border-color 0.2s ease;
      &:hover {
        transform: translateY(-2px);
        border-color: var(--accent-gold);
      }
      .stat-label { font-size: 0.85rem; color: var(--text-muted); }
      .stat-value { font-size: 2.2rem; font-weight: 700; color: var(--text-main); }
      .highlight-danger { color: #ff6b6b; }
      .highlight-gold { color: var(--accent-gold); }
      .stat-trend { font-size: 0.8rem; color: var(--text-muted); }
    }
    .admin-tabs {
      display: flex;
      gap: 12px;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 12px;
      flex-wrap: wrap;
      .tab-btn {
        background: var(--bg-card);
        color: var(--text-muted);
        border: 1px solid var(--border-subtle);
        padding: 10px 18px;
        border-radius: 10px;
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s;
        &.active, &:hover {
          color: #121118;
          background: var(--accent-gold);
          border-color: var(--accent-gold);
        }
      }
    }
    .section-card {
      padding: 22px;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 18px;
      flex-wrap: wrap;
      h2 { margin: 0 0 4px; font-size: 1.2rem; color: var(--text-main); }
      .section-sub { margin: 0; font-size: 0.85rem; color: var(--text-muted); }
    }
    .search-and-filter {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }
    .admin-search-input {
      background: #121118;
      border: 1px solid var(--border-subtle);
      color: var(--text-main);
      padding: 8px 14px;
      border-radius: 10px;
      min-width: 260px;
      font-size: 0.88rem;
      outline: none;
      &:focus { border-color: var(--accent-gold); }
    }
    .filter-pills {
      display: flex;
      gap: 6px;
      button {
        background: #121118;
        color: var(--text-muted);
        border: 1px solid var(--border-subtle);
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 0.8rem;
        cursor: pointer;
        &.active {
          background: var(--accent-primary);
          color: var(--accent-gold);
          border-color: var(--accent-gold);
          font-weight: 600;
        }
      }
    }
    .inspected-post-box {
      background: #121118;
      border: 1px solid var(--accent-gold);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 18px;
      .inspect-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: var(--accent-gold);
        margin-bottom: 8px;
      }
      .close-inspect {
        background: none;
        border: 1px solid var(--border-subtle);
        color: var(--text-muted);
        padding: 4px 10px;
        border-radius: 6px;
        cursor: pointer;
      }
      .inspect-content {
        margin: 0 0 10px;
        font-size: 0.95rem;
        line-height: 1.5;
      }
      img {
        max-height: 200px;
        border-radius: 8px;
        margin-bottom: 8px;
        display: block;
      }
      .inspect-meta {
        font-size: 0.8rem;
        color: var(--text-muted);
      }
    }
    .table-responsive { overflow-x: auto; }
    .woob-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.9rem;
      th, td {
        padding: 12px 14px;
        border-bottom: 1px solid var(--border-subtle);
      }
      th {
        color: var(--text-muted);
        font-weight: 600;
        background: rgba(18, 17, 24, 0.5);
      }
    }
    .target-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 0.78rem;
      font-weight: 600;
      &.post-target {
        background: rgba(200, 169, 81, 0.15);
        color: var(--accent-gold);
        border: 1px solid rgba(200, 169, 81, 0.35);
      }
      &.user-target {
        background: rgba(74, 67, 99, 0.35);
        color: #d0c8e8;
        border: 1px solid var(--border-subtle);
      }
    }
    .status-pill {
      padding: 3px 8px;
      border-radius: 10px;
      font-size: 0.75rem;
      font-weight: 600;
      &.pending, &.banned { background: rgba(158, 59, 59, 0.25); color: #ff8080; }
      &.resolved, &.active { background: rgba(62, 123, 84, 0.25); color: #75e09a; }
      &.dismissed { background: rgba(255,255,255,0.08); color: var(--text-muted); }
    }
    .role-tag {
      font-size: 0.75rem;
      color: var(--accent-gold);
      border: 1px solid rgba(200, 169, 81, 0.4);
      padding: 2px 8px;
      border-radius: 8px;
    }
    .user-link {
      color: var(--text-main);
      font-weight: 600;
      text-decoration: none;
      &:hover { color: var(--accent-gold); }
    }
    .truncate-cell {
      max-width: 300px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .actions-cell {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .btn-xs {
      padding: 5px 10px;
      font-size: 0.78rem;
      border-radius: 6px;
    }
    .empty-row {
      text-align: center;
      color: var(--text-muted);
      padding: 28px;
    }
    @media (max-width: 992px) {
      .analytics-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 600px) {
      .analytics-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  authService = inject(AuthService);
  private adminService = inject(AdminService);
  private feedback = inject(FeedbackService);
  private platformId = inject(PLATFORM_ID);
  private route = inject(ActivatedRoute);
  private pendingInspectId: number | null = null;

  get currentUser() {
    return this.authService.currentUser();
  }

  activeTab = signal<'reports' | 'users' | 'posts'>('reports');

  users = signal<AdminUserItem[]>([]);
  reports = signal<ReportItem[]>([]);
  posts = signal<PostItem[]>([]);

  reportFilter = signal<'ALL' | 'PENDING' | 'POSTS' | 'USERS'>('ALL');
  userFilter = signal<'ALL' | 'BANNED' | 'ACTIVE'>('ALL');
  userSearchQuery = '';
  postSearchQuery = '';

  inspectedPost = signal<PostItem | null>(null);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadAllData();
      this.route.queryParams.subscribe(params => {
        const id = Number(params["inspectPost"]);
        if (id) {
          this.activeTab.set("reports");
          this.pendingInspectId = id;
          this.checkAndInspect();
        }
      });
    }
  }

  private checkAndInspect(): void {
    if (this.pendingInspectId && this.posts().length > 0) {
      this.inspectPostById(this.pendingInspectId);
      this.pendingInspectId = null;
    }
  }

  getReportStatus(r: ReportItem): 'PENDING' | 'RESOLVED' | 'DISMISSED' {
    if (r.status) return r.status;
    return r.resolved ? 'RESOLVED' : 'PENDING';
  }

  pendingReportsCount = computed(() =>
    this.reports().filter(r => this.getReportStatus(r) === 'PENDING').length
  );

  bannedUsersCount = computed(() =>
    this.users().filter(u => u.banned).length
  );

  hiddenPostsCount = computed(() =>
    this.posts().filter(p => p.hidden).length
  );

  mostReportedUsers = computed(() => {
    const counts: { [userId: number]: { username: string; count: number; userId: number } } = {};
    for (const r of this.reports()) {
      if (!counts[r.reportedUserId]) {
        counts[r.reportedUserId] = { userId: r.reportedUserId, username: r.reportedUsername, count: 0 };
      }
      counts[r.reportedUserId].count++;
    }
    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  });

  filteredReports(): ReportItem[] {
    const filter = this.reportFilter();
    return this.reports().filter(r => {
      if (filter === 'PENDING') return this.getReportStatus(r) === 'PENDING';
      if (filter === 'POSTS') return !!r.reportedPostId;
      if (filter === 'USERS') return !r.reportedPostId;
      return true;
    });
  }

  filteredUsers(): AdminUserItem[] {
    const q = this.userSearchQuery.trim().toLowerCase();
    const f = this.userFilter();
    return this.users()
      .filter(u => {
        if (f === 'BANNED' && !u.banned) return false;
        if (f === 'ACTIVE' && u.banned) return false;
        if (q && !u.username.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) {
          return false;
        }
        return true;
      })
      .slice(0, 50);
  }

  moderatedOrSearchedPosts(): PostItem[] {
    const q = this.postSearchQuery.trim().toLowerCase();
    // Scalable approach: Only show hidden posts unless the admin searches for a specific post!
    if (!q) {
      return this.posts().filter(p => p.hidden);
    }
    return this.posts()
      .filter(p =>
        `#${p.id}`.includes(q) ||
        String(p.id) === q ||
        p.authorUsername.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q)
      )
      .slice(0, 30);
  }

  isPostHidden(postId: number): boolean {
    return !!this.posts().find(p => p.id === postId)?.hidden;
  }

  isUserBanned(userId: number): boolean {
    return !!this.users().find(u => u.id === userId)?.banned;
  }

  inspectPostById(postId: number): void {
    const found = this.posts().find(p => p.id === postId);
    if (found) {
      this.inspectedPost.set(found);
    } else {
      this.feedback.showError(`Post #${postId} was already deleted.`);
    }
  }

  loadAllData(): void {
    this.adminService.getAllUsers().subscribe({
      next: (u) => this.users.set(u),
      error: () => this.feedback.showError('Failed to load users')
    });
    this.adminService.getAllReports().subscribe({
      next: (r) => this.reports.set(r),
      error: () => this.feedback.showError('Failed to load reports')
    });
    this.adminService.getAllPosts().subscribe({
      next: (p) => this.posts.set(p),
      error: () => this.feedback.showError('Failed to load posts')
    });
  }

  // Contextual Post Report Action: Hide or Unhide the Reported Post
  toggleHideReportedPost(report: ReportItem): void {
    if (!report.reportedPostId) return;
    const postId = report.reportedPostId;
    const currentlyHidden = this.isPostHidden(postId);
    const action = currentlyHidden ? 'Unhide' : 'Hide';

    this.feedback.confirm({
      title: `${action} Reported Post #${postId}`,
      message: `Are you sure you want to ${action.toLowerCase()} Post #${postId} by @${report.reportedUsername}?`,
      confirmText: `Yes, ${action} Post`,
      isDestructive: !currentlyHidden
    }).subscribe(confirmed => {
      if (confirmed) {
        const req$ = currentlyHidden
          ? this.adminService.unhidePost(postId)
          : this.adminService.hidePost(postId);

        req$.subscribe({
          next: (updatedPost) => {
            this.posts.update(list => list.map(p => p.id === postId ? updatedPost : p));
            if (this.inspectedPost()?.id === postId) {
              this.inspectedPost.set(updatedPost);
            }
            if (!currentlyHidden) {
              this.markReportResolvedLocally(report);
            }
            this.feedback.showSuccess(`Post #${postId} is now ${updatedPost.hidden ? 'hidden' : 'public'}!`);
          },
          error: (err) => this.feedback.showError(err.error?.message || 'Failed to update post visibility')
        });
      }
    });
  }

  // Contextual User Report Action: Ban or Unban the Reported User
  banOrUnbanFromReport(report: ReportItem): void {
    const currentlyBanned = this.isUserBanned(report.reportedUserId);
    const action = currentlyBanned ? 'Unban' : 'Ban';

    this.feedback.confirm({
      title: `${action} @${report.reportedUsername}`,
      message: `Are you sure you want to ${action.toLowerCase()} user @${report.reportedUsername}?`,
      confirmText: `Yes, ${action} User`,
      isDestructive: !currentlyBanned
    }).subscribe(confirmed => {
      if (confirmed) {
        const req$ = currentlyBanned
          ? this.adminService.unbanUser(report.reportedUserId)
          : this.adminService.banUser(report.reportedUserId);

        req$.subscribe({
          next: (updatedUser) => {
            this.users.update(list => list.map(u => u.id === report.reportedUserId ? updatedUser : u));
            if (!currentlyBanned) {
              this.markReportResolvedLocally(report);
            }
            this.feedback.showSuccess(`User @${report.reportedUsername} ${updatedUser.banned ? 'banned' : 'unbanned'}!`);
          },
          error: (err) => this.feedback.showError(err.error?.message || 'Failed to update user status')
        });
      }
    });
  }

  private markReportResolvedLocally(report: ReportItem): void {
    this.adminService.resolveReport(report.id, 'RESOLVED').subscribe({
      next: (updated) => {
        this.reports.update(list => list.map(r => r.id === report.id ? { ...updated, status: 'RESOLVED', resolved: true } : r));
      },
      error: () => {
        this.reports.update(list => list.map(r => r.id === report.id ? { ...r, status: 'RESOLVED', resolved: true } : r));
      }
    });
  }

  promoteToAdmin(user: AdminUserItem): void {
    this.feedback.confirm({
      title: `Promote @${user.username} to Administrator`,
      message: `Grant full administrative privileges to @${user.username}? They will be able to moderate content and manage users.`,
      confirmText: 'Yes, Promote',
      isDestructive: false
    }).subscribe(confirmed => {
      if (confirmed) {
        this.adminService.updateUserRole(user.id, 'ADMIN').subscribe({
          next: (updated) => {
            this.users.update(list => list.map(u => u.id === user.id ? updated : u));
            this.feedback.showSuccess(`@${user.username} is now an Administrator!`);
          },
          error: (err) => this.feedback.showError(err.error?.message || 'Failed to update user role')
        });
      }
    });
  }

  demoteToUser(user: AdminUserItem): void {
    this.feedback.confirm({
      title: `Demote @${user.username} to Standard User`,
      message: `Revoke administrative privileges from @${user.username}? They will no longer have access to moderation tools.`,
      confirmText: 'Yes, Demote',
      isDestructive: true
    }).subscribe(confirmed => {
      if (confirmed) {
        this.adminService.updateUserRole(user.id, 'USER').subscribe({
          next: (updated) => {
            this.users.update(list => list.map(u => u.id === user.id ? updated : u));
            this.feedback.showSuccess(`@${user.username} has been demoted to User.`);
          },
          error: (err) => this.feedback.showError(err.error?.message || 'Failed to demote user')
        });
      }
    });
  }

  toggleBanUser(user: AdminUserItem): void {
    const actionLabel = user.banned ? 'Unban' : 'Ban';
    this.feedback.confirm({
      title: `${actionLabel} User @${user.username}`,
      message: `Are you sure you want to ${actionLabel.toLowerCase()} @${user.username}?`,
      confirmText: `Yes, ${actionLabel}`,
      isDestructive: !user.banned
    }).subscribe(confirmed => {
      if (confirmed) {
        const req$ = user.banned
          ? this.adminService.unbanUser(user.id)
          : this.adminService.banUser(user.id);

        req$.subscribe({
          next: (updated) => {
            this.users.update(list => list.map(u => u.id === user.id ? updated : u));
            this.feedback.showSuccess(`User @${user.username} ${user.banned ? 'unbanned' : 'banned'}!`);
          },
          error: (err) => this.feedback.showError(err.error?.message || 'Action failed')
        });
      }
    });
  }

  deleteUser(user: AdminUserItem): void {
    this.feedback.confirm({
      title: `Delete User @${user.username}`,
      message: `This will permanently delete @${user.username} and all their posts. Proceed?`,
      confirmText: 'Delete Permanently',
      isDestructive: true
    }).subscribe(confirmed => {
      if (confirmed) {
        this.adminService.deleteUser(user.id).subscribe({
          next: () => {
            this.users.update(list => list.filter(u => u.id !== user.id));
            this.feedback.showSuccess(`User @${user.username} deleted`);
          },
          error: (err) => this.feedback.showError(err.error?.message || 'Could not delete user')
        });
      }
    });
  }

  updateReportStatus(report: ReportItem, status: 'RESOLVED' | 'DISMISSED'): void {
    this.feedback.confirm({
      title: `Mark Report as ${status}`,
      message: `Confirm marking report #${report.id} against @${report.reportedUsername} as ${status}?`,
      confirmText: status,
      isDestructive: false
    }).subscribe(confirmed => {
      if (confirmed) {
        this.adminService.resolveReport(report.id, status).subscribe({
          next: (updated) => {
            this.reports.update(list => list.map(r => r.id === report.id ? { ...updated, status, resolved: true } : r));
            this.feedback.showSuccess(`Report #${report.id} marked as ${status}`);
          },
          error: () => {
            this.reports.update(list => list.map(r => r.id === report.id ? { ...r, status, resolved: true } : r));
            this.feedback.showSuccess(`Report #${report.id} marked as ${status}`);
          }
        });
      }
    });
  }

  deleteReportedPost(report: ReportItem): void {
    if (!report.reportedPostId) return;
    const postId = report.reportedPostId;
    this.feedback.confirm({
      title: `Delete Reported Post #${postId}`,
      message: `Permanently delete Post #${postId} and resolve this report?`,
      confirmText: 'Delete Post',
      isDestructive: true
    }).subscribe(confirmed => {
      if (confirmed) {
        this.adminService.deletePost(postId).subscribe({
          next: () => {
            this.posts.update(list => list.filter(p => p.id !== postId));
            if (this.inspectedPost()?.id === postId) {
              this.inspectedPost.set(null);
            }
            this.markReportResolvedLocally(report);
            this.feedback.showSuccess(`Post #${postId} deleted and report resolved!`);
          },
          error: (err) => this.feedback.showError(err.error?.message || 'Post already deleted or failed')
        });
      }
    });
  }

  toggleHidePost(post: PostItem): void {
    const action = post.hidden ? 'Unhide' : 'Hide';
    this.feedback.confirm({
      title: `${action} Post #${post.id}`,
      message: `Are you sure you want to ${action.toLowerCase()} this post by @${post.authorUsername}?`,
      confirmText: `Yes, ${action}`,
      isDestructive: !post.hidden
    }).subscribe(confirmed => {
      if (confirmed) {
        const req$ = post.hidden
          ? this.adminService.unhidePost(post.id)
          : this.adminService.hidePost(post.id);

        req$.subscribe({
          next: (updated) => {
            this.posts.update(list => list.map(p => p.id === post.id ? updated : p));
            this.feedback.showSuccess(`Post #${post.id} is now ${updated.hidden ? 'hidden' : 'public'}`);
          },
          error: () => this.feedback.showError('Failed to update post visibility')
        });
      }
    });
  }

  deletePost(post: PostItem): void {
    this.feedback.confirm({
      title: `Delete Post #${post.id}`,
      message: `Are you sure you want to permanently delete Post #${post.id} by @${post.authorUsername}?`,
      confirmText: 'Delete Post',
      isDestructive: true
    }).subscribe(confirmed => {
      if (confirmed) {
        this.adminService.deletePost(post.id).subscribe({
          next: () => {
            this.posts.update(list => list.filter(p => p.id !== post.id));
            this.feedback.showSuccess(`Post #${post.id} deleted!`);
          },
          error: () => this.feedback.showError('Failed to delete post')
        });
      }
    });
  }
}
