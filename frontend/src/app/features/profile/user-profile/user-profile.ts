import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { UserService, UserProfile } from '../../../core/services/user.service';
import { PostService, PostItem, CommentItem } from '../../../core/services/post.service';
import { FeedbackService } from '../../../shared/services/feedback.service';
import { ReportModalComponent } from '../../../shared/components/report-modal/report-modal';
import { MarkdownPipe } from '../../../shared/pipes/markdown.pipe';
import { MascotComponent } from '../../../shared/components/mascot/mascot.component';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MarkdownPipe, MascotComponent],
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

            <button class="btn-danger" *ngIf="user.role !== 'ADMIN'" (click)="openReportUserModal()">
              🚩 Report User
            </button>
            <span *ngIf="user.role === 'ADMIN'" class="role-pill" style="font-size: 0.85rem; padding: 6px 12px;">
              🛡️ Platform Administrator
            </span>
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
        <app-mascot [expression]="'tired'" [size]="78" [animated]="true"></app-mascot>
        <p style="margin-top: 14px;">No posts published on this block yet.</p>
      </div>

      <div class="posts-list">
        <div *ngFor="let post of posts()" class="post-card woob-card">
          <div class="post-top">
            <span class="timestamp">{{ post.createdAt | date:'medium' }}</span>
            <div class="crud-controls">
              <button *ngIf="isOwnProfile()" class="btn-steel btn-sm" (click)="startEdit(post)">✏️ Edit</button>
              <button *ngIf="isOwnProfile() || authService.isAdmin()" class="btn-danger btn-sm" (click)="deletePost(post)">🗑️ Delete</button>
              <button *ngIf="!isOwnProfile() && post.authorRole !== 'ADMIN'" class="btn-steel btn-sm report-post-btn" (click)="reportPost(post)">🚩 Report</button>
            </div>
          </div>

          <div class="markdown-content" [innerHTML]="post.content | markdown"></div>

          <div class="post-media" *ngIf="post.mediaUrl">
            <img *ngIf="post.mediaType === 'IMAGE'" [src]="'http://localhost:8080' + post.mediaUrl" loading="lazy" alt="Post media" />
            <video *ngIf="post.mediaType === 'VIDEO'" [src]="'http://localhost:8080' + post.mediaUrl" controls></video>
          </div>

          <!-- Interactive Action Bar: Like & Comment -->
          <div class="post-interactions">
            <button class="interact-btn" [class.liked]="post.likedByCurrentUser" (click)="toggleLike(post)" [title]="post.likedByCurrentUser ? 'Unlike' : 'Like'">
              <span class="heart-icon">{{ post.likedByCurrentUser ? '❤️' : '🤍' }}</span>
              <span>{{ post.likesCount }}</span>
            </button>

            <button class="interact-btn" (click)="toggleComments(post)" title="Comments">
              <span>💬</span>
              <span>{{ post.commentsCount }}</span>
            </button>
          </div>

          <!-- Inline Comments Section -->
          <div class="comments-section" *ngIf="openCommentsPostId() === post.id">
            <div class="comments-list">
              <div *ngFor="let c of activeComments()" class="comment-item">
                <div class="comment-content">
                  <a [routerLink]="['/profile', c.authorId]" class="comment-author">@{{ c.authorUsername }}:</a>
                  <span class="comment-text">{{ c.content }}</span>
                </div>
                <button *ngIf="currentUser?.id === c.authorId || currentUser?.id === post.authorId || authService.isAdmin()" 
                        class="del-comment-btn" 
                        (click)="deleteComment(c.id, post)"
                        title="Delete comment">✕</button>
              </div>
              <div *ngIf="activeComments().length === 0" class="no-comments">No comments yet. Be the first to comment!</div>
            </div>

            <div class="comment-input-row" *ngIf="authService.isAuthenticated()">
              <input type="text" [(ngModel)]="newCommentText" placeholder="Write a comment..." (keyup.enter)="submitComment(post)" />
              <button class="btn-gold btn-sm" (click)="submitComment(post)" [disabled]="!newCommentText.trim()">Send</button>
            </div>
            <div class="login-prompt" *ngIf="!authService.isAuthenticated()">
              <a routerLink="/login">Sign in</a> to leave a comment.
            </div>
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
        var(--banner-grad-1),
        var(--banner-grad-1) 14px,
        var(--banner-grad-2),
        var(--banner-grad-2) 28px
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
        color: #FFFFFF;
        box-shadow: var(--avatar-shadow);
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
        background: var(--bg-input);
        border: 1px solid var(--border-input);
        border-radius: 10px;
        color: var(--text-main);
        padding: 12px;
        font-size: 0.95rem;
        margin-bottom: 12px;
        outline: none;
        transition: all 0.2s;
        &:focus {
          background: var(--bg-input-focus);
          border-color: var(--accent-gold);
          box-shadow: 0 0 0 3px rgba(172, 126, 27, 0.15);
        }
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
    .report-post-btn {
      color: var(--text-muted);
      border: 1px solid var(--border-subtle);
      background: transparent;
      &:hover { color: var(--danger); border-color: var(--danger); background: var(--danger-subtle); }
    }
    .post-body { font-size: 0.98rem; line-height: 1.5; margin: 0 0 14px; white-space: pre-wrap; }
    .post-media {
      margin-bottom: 12px;
      img, video { width: 100%; max-height: 440px; object-fit: cover; border-radius: 10px; }
    }
    .post-interactions {
      display: flex;
      gap: 16px;
      border-top: 1px solid var(--border-subtle);
      padding-top: 12px;
      .interact-btn {
        background: none;
        border: none;
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--text-muted);
        cursor: pointer;
        font-size: 0.9rem;
        padding: 6px 12px;
        border-radius: 8px;
        transition: all 0.2s ease;
        &:hover {
          color: var(--text-main);
          background: var(--bg-hover);
        }
        &.liked {
          color: var(--accent-gold);
          font-weight: 600;
        }
      }
    }
    .comments-section {
      margin-top: 14px;
      border-top: 1px dashed var(--border-subtle);
      padding-top: 12px;
      .comments-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
      .comment-item {
        font-size: 0.88rem;
        background: var(--bg-input);
        padding: 10px 14px;
        border-radius: 8px;
        border: 1px solid var(--border-subtle);
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 8px;
        .comment-content {
          flex: 1;
          word-break: break-word;
          .comment-author {
            color: var(--accent-gold);
            font-weight: 600;
            text-decoration: none;
            margin-right: 6px;
            &:hover { text-decoration: underline; }
          }
          .comment-text {
            color: var(--text-main);
          }
        }
        .del-comment-btn {
          background: none;
          border: none;
          color: var(--danger);
          cursor: pointer;
          font-size: 0.78rem;
          padding: 2px 6px;
          border-radius: 4px;
          &:hover { background: var(--danger-subtle); }
        }
      }
      .no-comments { font-size: 0.82rem; color: var(--text-muted); padding: 4px 0; }
      .comment-input-row {
        display: flex;
        gap: 8px;
        input {
          flex: 1;
          background: var(--bg-input);
          border: 1px solid var(--border-input);
          border-radius: 8px;
          padding: 8px 12px;
          color: var(--text-main);
          font-size: 0.88rem;
          outline: none;
          transition: all 0.2s;
          &:focus {
            background: var(--bg-input-focus);
            border-color: var(--accent-gold);
            box-shadow: 0 0 0 3px rgba(172, 126, 27, 0.15);
          }
        }
      }
      .login-prompt {
        font-size: 0.85rem;
        color: var(--text-muted);
        padding: 6px 0;
        a {
          color: var(--accent-gold);
          font-weight: 600;
          text-decoration: none;
          &:hover { text-decoration: underline; }
        }
      }
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
  removeMedia = false;
  mediaPreviewUrl = signal<string | null>(null);
  mediaPreviewType = signal<'IMAGE' | 'VIDEO' | null>(null);

  // Comments & Likes Signals for Profile Posts
  openCommentsPostId = signal<number | null>(null);
  activeComments = signal<CommentItem[]>([]);
  newCommentText = '';

  get currentUser() {
    return this.authService.currentUser();
  }

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
      this.removeMedia = false;
      this.mediaPreviewType.set(file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE');
      this.mediaPreviewUrl.set(URL.createObjectURL(file));
      this.feedback.showSuccess(`Selected file: ${file.name}`);
    }
  }

  clearMedia(): void {
    this.selectedFile = null;
    this.removeMedia = true;
    this.mediaPreviewUrl.set(null);
    this.mediaPreviewType.set(null);
  }

  startEdit(post: PostItem): void {
    this.editingPostId.set(post.id);
    this.postContent = post.content;
    this.selectedFile = null;
    this.removeMedia = false;
    if (post.mediaUrl) {
      this.mediaPreviewType.set(post.mediaType);
      this.mediaPreviewUrl.set('http://localhost:8080' + post.mediaUrl);
    } else {
      this.clearMedia();
      this.removeMedia = false;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.editingPostId.set(null);
    this.postContent = '';
    this.removeMedia = false;
    this.clearMedia();
  }

  savePost(): void {
    if (!this.postContent.trim()) return;
    this.savingPost.set(true);

    const editId = this.editingPostId();
    const req$ = editId
      ? this.userService.updatePost(editId, this.postContent, this.selectedFile, this.removeMedia)
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

  toggleLike(post: PostItem): void {
    if (!this.authService.isAuthenticated()) {
      this.feedback.showError('Please sign in to like posts');
      return;
    }

    const action$ = post.likedByCurrentUser
      ? this.postService.unlikePost(post.id)
      : this.postService.likePost(post.id);

    action$.subscribe({
      next: (updated) => {
        this.posts.update(list => list.map(p => p.id === post.id ? updated : p));
        this.feedback.showSuccess(updated.likedByCurrentUser ? 'Post liked!' : 'Post unliked');
      },
      error: (err) => this.feedback.showError(err.error?.message || 'Action failed')
    });
  }

  toggleComments(post: PostItem): void {
    if (this.openCommentsPostId() === post.id) {
      this.openCommentsPostId.set(null);
      this.activeComments.set([]);
    } else {
      this.openCommentsPostId.set(post.id);
      this.postService.getComments(post.id).subscribe({
        next: (comments) => this.activeComments.set(comments),
        error: () => this.feedback.showError('Could not load comments')
      });
    }
  }

  submitComment(post: PostItem): void {
    if (!this.authService.isAuthenticated()) {
      this.feedback.showError('Please sign in to comment');
      return;
    }
    if (!this.newCommentText.trim()) return;

    this.postService.addComment(post.id, this.newCommentText).subscribe({
      next: (comment) => {
        this.activeComments.update(list => [...list, comment]);
        this.posts.update(list => list.map(p => p.id === post.id ? { ...p, commentsCount: p.commentsCount + 1 } : p));
        this.newCommentText = '';
        this.feedback.showSuccess('Comment added!');
      },
      error: (err) => this.feedback.showError(err.error?.message || 'Failed to add comment')
    });
  }

  deleteComment(commentId: number, post: PostItem): void {
    this.feedback.confirm({
      title: 'Delete Comment',
      message: 'Are you sure you want to delete this comment?',
      confirmText: 'Delete',
      isDestructive: true
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.postService.deleteComment(commentId).subscribe({
          next: () => {
            this.activeComments.update(list => list.filter(c => c.id !== commentId));
            this.posts.update(list => list.map(p => p.id === post.id ? { ...p, commentsCount: p.commentsCount - 1 } : p));
            this.feedback.showSuccess('Comment deleted');
          },
          error: (err) => this.feedback.showError(err.error?.message || 'Delete failed')
        });
      }
    });
  }

  reportPost(post: PostItem): void {
    const prof = this.profile();
    const dialogRef = this.dialog.open(ReportModalComponent, {
      data: {
        targetUsername: post.authorUsername || prof?.username || 'user',
        targetUserId: post.authorId || prof!.id,
        postId: post.id
      }
    });

    dialogRef.afterClosed().subscribe((reason: string | null) => {
      if (reason) {
        this.postService.reportUser(post.authorId || prof!.id, reason, post.id).subscribe({
          next: () => this.feedback.showSuccess('Report submitted to administrators for review'),
          error: (err) => this.feedback.showError(err.error?.message || 'Report submission failed')
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
