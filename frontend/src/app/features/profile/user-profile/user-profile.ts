import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { UserService, UserProfile } from '../../../core/services/user.service';
import { PostService, PostItem } from '../../../core/services/post.service';
import { FeedbackService } from '../../../shared/services/feedback.service';
import { ReportModalComponent } from '../../../shared/components/report-modal/report-modal';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="profile-container" *ngIf="profile() as user">
      <!-- Profile Banner & Header Card -->
      <div class="profile-header-card woob-card">
        <div class="knit-banner"></div>

        <div class="profile-identity">
          <div class="profile-avatar">
            {{ user.username.charAt(0).toUpperCase() }}
          </div>

          <h2>@{{ user.username }}</h2>
          <p class="stats-line">
            <strong>{{ user.followersCount }}</strong> Subscribers •
            <strong>{{ user.followingCount }}</strong> Subscribed •
            <strong>{{ user.postsCount }}</strong> Posts
          </p>
          <p class="bio-text">{{ user.bio || 'Crafting and sharing on Woob 🧶' }}</p>

          <!-- Action Buttons for Other Users' Profiles -->
          <div class="profile-actions" *ngIf="!isOwnProfile()">
            <button
              [class]="user.subscribedByCurrentUser ? 'btn-steel' : 'btn-gold'"
              (click)="toggleSubscribe()"
              [disabled]="subLoading()"
            >
              {{ user.subscribedByCurrentUser ? '✓ Subscribed (Unsubscribe)' : '+ Subscribe' }}
            </button>

            <button class="btn-danger" (click)="openReportUserModal()">
              🚩 Report User
            </button>
          </div>
        </div>
      </div>

      <!-- Personal Block Publisher (Only on Own Profile) -->
      <div class="create-post-card woob-card" *ngIf="isOwnProfile()">
        <h3>{{ editingPostId() ? '✏️ Edit Post #' + editingPostId() : '➕ Create New Post on My Block' }}</h3>
        <textarea
          [(ngModel)]="postContent"
          rows="3"
          placeholder="Share something on your personal block..."
        ></textarea>

        <!-- Pre-submission Media Preview -->
        <div class="media-preview-box" *ngIf="mediaPreviewUrl()">
          <img *ngIf="mediaPreviewType() === 'IMAGE'" [src]="mediaPreviewUrl()" alt="Preview" />
          <video *ngIf="mediaPreviewType() === 'VIDEO'" [src]="mediaPreviewUrl()" controls></video>
          <button class="clear-media" (click)="clearMedia()">✕</button>
        </div>

        <div class="publisher-footer">
          <label class="upload-label">
            📷 Attach Image / Video
            <input type="file" (change)="onFileSelected($event)" accept="image/*,video/*" hidden />
          </label>

          <div class="btn-group">
            <button *ngIf="editingPostId()" class="btn-steel" (click)="cancelEdit()">Cancel</button>
            <button class="btn-gold" (click)="savePost()" [disabled]="savingPost() || !postContent.trim()">
              {{ editingPostId() ? 'Update Post' : 'Publish Post' }}
            </button>
          </div>
        </div>
      </div>

      <!-- User's Posts Grid / Stream -->
      <h3 class="section-heading">🧵 Posts by @{{ user.username }}</h3>

      <div *ngIf="posts().length === 0" class="empty-block woob-card">
        <span>🧶</span>
        <p>No posts published on this block yet.</p>
      </div>

      <div class="posts-list">
        <div *ngFor="let post of posts()" class="post-card woob-card">
          <div class="post-top">
            <span class="timestamp">{{ post.createdAt | date:'medium' }}</span>
            <div class="crud-controls" *ngIf="isOwnProfile() || authService.isAdmin()">
              <button *ngIf="isOwnProfile()" class="btn-steel btn-sm" (click)="startEdit(post)">✏️ Edit</button>
              <button class="btn-danger btn-sm" (click)="deletePost(post)">🗑️ Delete</button>
            </div>
          </div>

          <p class="post-body">{{ post.content }}</p>

          <div class="post-media" *ngIf="post.mediaUrl">
            <img *ngIf="post.mediaType === 'IMAGE'" [src]="'http://localhost:8080' + post.mediaUrl" loading="lazy" alt="Post media" />
            <video *ngIf="post.mediaType === 'VIDEO'" [src]="'http://localhost:8080' + post.mediaUrl" controls></video>
          </div>

          <div class="post-stats">
            <span>❤️ {{ post.likesCount }} Likes</span>
            <span>💬 {{ post.commentsCount }} Comments</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-container {
      max-width: 820px;
      margin: 28px auto;
      padding: 0 16px;
    }
    .profile-header-card {
      overflow: hidden;
      margin-bottom: 24px;
      text-align: center;
    }
    .knit-banner {
      height: 130px;
      background: repeating-linear-gradient(
        45deg,
        #2E2A37,
        #2E2A37 14px,
        #4A4363 14px,
        #4A4363 28px
      );
      border-bottom: 2px solid var(--accent-gold);
    }
    .profile-identity {
      padding: 0 24px 28px;
      position: relative;
      .profile-avatar {
        width: 88px;
        height: 88px;
        border-radius: 50%;
        background: var(--accent-primary);
        border: 3px solid var(--accent-gold);
        margin: -44px auto 12px;
        display: grid;
        place-items: center;
        font-size: 2.2rem;
        font-weight: 700;
        color: var(--accent-gold);
        box-shadow: 0 6px 20px rgba(0,0,0,0.5);
      }
      h2 { margin: 0 0 6px; font-size: 1.6rem; }
      .stats-line { color: var(--text-muted); font-size: 0.92rem; margin: 0 0 10px; }
      .bio-text { max-width: 520px; margin: 0 auto 18px; line-height: 1.5; }
    }
    .profile-actions {
      display: flex;
      justify-content: center;
      gap: 12px;
    }
    .create-post-card {
      padding: 20px;
      margin-bottom: 28px;
      h3 { margin: 0 0 12px; font-size: 1.1rem; color: var(--accent-gold); }
      textarea {
        width: 100%;
        background: #121118;
        border: 1px solid var(--border-subtle);
        border-radius: 10px;
        color: var(--text-main);
        padding: 12px;
        font-size: 0.95rem;
        margin-bottom: 12px;
        outline: none;
        &:focus { border-color: var(--accent-gold); }
      }
    }
    .media-preview-box {
      position: relative;
      display: inline-block;
      margin-bottom: 12px;
      img, video { max-height: 220px; border-radius: 10px; border: 1px solid var(--border-subtle); }
      .clear-media {
        position: absolute;
        top: 6px;
        right: 6px;
        background: rgba(0,0,0,0.8);
        color: white;
        border: none;
        border-radius: 50%;
        width: 26px;
        height: 26px;
        cursor: pointer;
      }
    }
    .publisher-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      .upload-label { color: var(--accent-gold); cursor: pointer; font-size: 0.9rem; font-weight: 500; }
      .btn-group { display: flex; gap: 10px; }
    }
    .section-heading { margin: 0 0 16px; font-size: 1.2rem; }
    .posts-list { display: flex; flex-direction: column; gap: 18px; }
    .post-card { padding: 20px; }
    .post-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      .timestamp { font-size: 0.8rem; color: var(--text-muted); }
      .crud-controls { display: flex; gap: 8px; }
    }
    .btn-sm { padding: 6px 12px; font-size: 0.8rem; }
    .post-body { font-size: 0.98rem; line-height: 1.5; margin: 0 0 14px; white-space: pre-wrap; }
    .post-media {
      margin-bottom: 12px;
      img, video { width: 100%; max-height: 440px; object-fit: cover; border-radius: 10px; }
    }
    .post-stats {
      display: flex;
      gap: 16px;
      font-size: 0.85rem;
      color: var(--text-muted);
      border-top: 1px solid var(--border-subtle);
      padding-top: 10px;
    }
    .empty-block { text-align: center; padding: 36px; color: var(--text-muted); }
  `]
})
export class UserProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);
  private userService = inject(UserService);
  private postService = inject(PostService);
  private feedback = inject(FeedbackService);
  private dialog = inject(MatDialog);
  authService = inject(AuthService);

  profile = signal<UserProfile | null>(null);
  posts = signal<PostItem[]>([]);
  subLoading = signal(false);
  savingPost = signal(false);

  editingPostId = signal<number | null>(null);
  postContent = '';
  selectedFile: File | null = null;
  mediaPreviewUrl = signal<string | null>(null);
  mediaPreviewType = signal<'IMAGE' | 'VIDEO' | null>(null);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.route.paramMap.subscribe(params => {
        const id = Number(params.get('id')) || this.authService.currentUser()?.id;
        if (id) {
          this.loadProfileAndPosts(id);
        }
      });
    }
  }

  isOwnProfile(): boolean {
    return this.authService.currentUser()?.id === this.profile()?.id;
  }

  loadProfileAndPosts(userId: number): void {
    this.userService.getUserProfile(userId).subscribe({
      next: (prof) => this.profile.set(prof),
      error: (err) => this.feedback.showError(err.error?.message || 'Could not load user profile')
    });

    this.userService.getUserPosts(userId).subscribe({
      next: (list) => this.posts.set(list),
      error: () => this.feedback.showError('Could not load user posts')
    });
  }

  toggleSubscribe(): void {
    const user = this.profile();
    if (!user) return;

    this.subLoading.set(true);
    const req$ = user.subscribedByCurrentUser
      ? this.userService.unsubscribe(user.id)
      : this.userService.subscribe(user.id);

    req$.pipe(finalize(() => this.subLoading.set(false))).subscribe({
      next: (updated) => {
        this.profile.set(updated);
        this.feedback.showSuccess(
          updated.subscribedByCurrentUser
            ? `Subscribed to @${updated.username}! Notifications enabled.`
            : `Unsubscribed from @${updated.username}`
        );
      },
      error: (err) => this.feedback.showError(err.error?.message || 'Subscription update failed')
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.mediaPreviewType.set(file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE');
      this.mediaPreviewUrl.set(URL.createObjectURL(file));
      this.feedback.showSuccess(`Selected file: ${file.name}`);
    }
  }

  clearMedia(): void {
    this.selectedFile = null;
    this.mediaPreviewUrl.set(null);
    this.mediaPreviewType.set(null);
  }

  startEdit(post: PostItem): void {
    this.editingPostId.set(post.id);
    this.postContent = post.content;
    if (post.mediaUrl) {
      this.mediaPreviewType.set(post.mediaType);
      this.mediaPreviewUrl.set('http://localhost:8080' + post.mediaUrl);
    } else {
      this.clearMedia();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.editingPostId.set(null);
    this.postContent = '';
    this.clearMedia();
  }

  savePost(): void {
    if (!this.postContent.trim()) return;
    this.savingPost.set(true);

    const editId = this.editingPostId();
    const req$ = editId
      ? this.userService.updatePost(editId, this.postContent, this.selectedFile)
      : this.postService.createPost(this.postContent, this.selectedFile);

    req$.pipe(finalize(() => this.savingPost.set(false))).subscribe({
      next: (saved) => {
        if (editId) {
          this.posts.update(list => list.map(p => p.id === editId ? saved : p));
          this.feedback.showSuccess('Post updated successfully!');
        } else {
          this.posts.update(list => [saved, ...list]);
          this.profile.update(u => u ? { ...u, postsCount: u.postsCount + 1 } : u);
          this.feedback.showSuccess('Post published to your block!');
        }
        this.cancelEdit();
      },
      error: (err) => this.feedback.showError(err.error?.message || 'Failed to save post')
    });
  }

  deletePost(post: PostItem): void {
    this.feedback.confirm({
      title: 'Delete Post',
      message: 'Are you sure you want to permanently delete this post?',
      confirmText: 'Delete Post',
      isDestructive: true
    }).subscribe(confirmed => {
      if (confirmed) {
        this.postService.deletePost(post.id).subscribe({
          next: () => {
            this.posts.update(list => list.filter(p => p.id !== post.id));
            this.profile.update(u => u ? { ...u, postsCount: Math.max(0, u.postsCount - 1) } : u);
            this.feedback.showSuccess('Post deleted!');
          },
          error: (err) => this.feedback.showError(err.error?.message || 'Could not delete post')
        });
      }
    });
  }

  openReportUserModal(): void {
    const user = this.profile();
    if (!user) return;

    const dialogRef = this.dialog.open(ReportModalComponent, {
      data: { targetUsername: user.username, targetUserId: user.id }
    });

    dialogRef.afterClosed().subscribe((reason: string | null) => {
      if (reason) {
        this.postService.reportUser(user.id, reason).subscribe({
          next: () => this.feedback.showSuccess(`Report against @${user.username} submitted!`),
          error: (err) => this.feedback.showError(err.error?.message || 'Failed to submit report')
        });
      }
    });
  }
}
