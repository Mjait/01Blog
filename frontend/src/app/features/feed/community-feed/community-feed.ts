import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { FeedbackService } from '../../../shared/services/feedback.service';
import { PostService, PostItem, CommentItem } from '../../../core/services/post.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-community-feed',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="feed-layout">
      <!-- Left Sidebar: Profile & Navigation -->
      <aside class="sidebar-left woob-card">
        <div class="user-quick-profile">
          <div class="avatar-large">🧶</div>
          <h3>@{{ currentUser?.username }}</h3>
          <span class="role-pill">{{ currentUser?.role }}</span>
        </div>

        <nav class="side-menu">
          <a [class.active]="feedMode() === 'all'" (click)="setMode('all')">🌐 Explore All</a>
          <a [class.active]="feedMode() === 'subscribed'" (click)="setMode('subscribed')">🏠 Subscribed Feed</a>
          <a [routerLink]="['/profile', currentUser?.id]">🧵 My Block</a>
          <a *ngIf="authService.isAdmin()" routerLink="/admin" class="admin-link">🛡️ Moderation Center</a>
        </nav>
      </aside>

      <!-- Center: Feed Stream & Publisher -->
      <section class="feed-center">
        <!-- Post Publisher Card -->
        <div class="create-post-card woob-card">
          <div class="create-top">
            <span class="creator-avatar">🧶</span>
            <textarea 
              [(ngModel)]="newPostContent" 
              placeholder="Share your latest creation or thought with the community..." 
              rows="3"
            ></textarea>
          </div>

          <!-- Pre-submission Media Preview -->
          <div class="media-preview-container" *ngIf="mediaPreviewUrl()">
            <div class="preview-box">
              <img *ngIf="mediaPreviewType() === 'IMAGE'" [src]="mediaPreviewUrl()" alt="Upload preview" />
              <video *ngIf="mediaPreviewType() === 'VIDEO'" [src]="mediaPreviewUrl()" controls></video>
              <button class="remove-btn" (click)="removeSelectedMedia()" title="Remove media">✕</button>
            </div>
          </div>

          <div class="create-actions">
            <div class="upload-buttons">
              <label class="media-btn">
                📷 Add Image/Video
                <input type="file" (change)="onFileSelected($event)" accept="image/*,video/*" hidden />
              </label>
              <span class="file-name" *ngIf="selectedFile">{{ selectedFile.name }}</span>
            </div>

            <button class="btn-gold" (click)="publishPost()" [disabled]="submitting() || !newPostContent.trim()">
              <span *ngIf="!submitting()">Publish</span>
              <span *ngIf="submitting()">Publishing...</span>
            </button>
          </div>
        </div>

        <!-- Posts List -->
        <div class="posts-stream">
          <!-- Loading State -->
          <div *ngIf="loading()" class="empty-state woob-card">
            <span class="mascot-empty">⏳</span>
            <p>Loading posts...</p>
          </div>

          <!-- Empty State -->
          <div *ngIf="!loading() && posts().length === 0" class="empty-state woob-card">
            <span class="mascot-empty">🧵</span>
            <h3>No posts found</h3>
            <p *ngIf="feedMode() === 'subscribed'">
              You haven't subscribed to any active creators yet. Switch to "Explore All" or publish a post!
            </p>
            <p *ngIf="feedMode() === 'all'">Be the first creator to share a post on Woob!</p>
          </div>

          <!-- Post Cards -->
          <div *ngFor="let post of posts()" class="post-card woob-card">
            <!-- Author Header -->
            <div class="post-header">
              <div class="author-info">
                <div class="author-avatar">
                  {{ post.authorUsername.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <a [routerLink]="['/profile', post.authorId]" class="author-name">
                    @{{ post.authorUsername }}
                  </a>
                  <span class="post-date">{{ post.createdAt | date:'short' }}</span>
                </div>
              </div>

              <!-- Author / Admin Actions -->
              <div class="post-menu">
                <button *ngIf="isOwnerOrAdmin(post)" class="action-link delete" (click)="deletePost(post)">
                  Delete
                </button>
                <button *ngIf="currentUser?.id !== post.authorId" class="action-link report" (click)="reportPost(post)">
                  Report
                </button>
              </div>
            </div>

            <!-- Content -->
            <p class="post-text">{{ post.content }}</p>

            <!-- Media Preview -->
            <div class="post-media" *ngIf="post.mediaUrl">
              <img *ngIf="post.mediaType === 'IMAGE'" [src]="'http://localhost:8080' + post.mediaUrl" loading="lazy" alt="Post attachment" />
              <video *ngIf="post.mediaType === 'VIDEO'" [src]="'http://localhost:8080' + post.mediaUrl" controls></video>
            </div>

            <!-- Interaction Bar -->
            <div class="post-interactions">
              <button class="interact-btn" [class.liked]="post.likedByCurrentUser" (click)="toggleLike(post)">
                <span>{{ post.likedByCurrentUser ? '❤️' : '🤍' }}</span>
                <span>{{ post.likesCount }}</span>
              </button>

              <button class="interact-btn" (click)="toggleComments(post)">
                <span>💬</span>
                <span>{{ post.commentsCount }}</span>
              </button>
            </div>

            <!-- Inline Comments Section -->
            <div class="comments-section" *ngIf="openCommentsPostId() === post.id">
              <div class="comments-list">
                <div *ngFor="let c of activeComments()" class="comment-item">
                  <strong>@{{ c.authorUsername }}:</strong> {{ c.content }}
                  <button *ngIf="currentUser?.id === c.authorId || currentUser?.id === post.authorId" 
                          class="del-comment-btn" 
                          (click)="deleteComment(c.id, post)">✕</button>
                </div>
                <div *ngIf="activeComments().length === 0" class="no-comments">No comments yet. Start the conversation!</div>
              </div>

              <div class="comment-input-row">
                <input type="text" [(ngModel)]="newCommentText" placeholder="Write a comment..." (keyup.enter)="submitComment(post)" />
                <button class="btn-gold" (click)="submitComment(post)" [disabled]="!newCommentText.trim()">Send</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Right Sidebar: Trending Tags -->
      <aside class="sidebar-right woob-card">
        <h4>Trending Tags</h4>
        <div class="tags-cluster">
          <span class="tag">#woob</span>
          <span class="tag">#crochet</span>
          <span class="tag">#knitting</span>
          <span class="tag">#handmade</span>
          <span class="tag">#editorial</span>
        </div>
      </aside>
    </div>
  `,
  styles: [`
    .feed-layout {
      max-width: 1240px;
      margin: 28px auto;
      padding: 0 16px;
      display: grid;
      grid-template-columns: 260px 1fr 260px;
      gap: 24px;
      align-items: start;
    }
    .user-quick-profile {
      text-align: center;
      padding: 20px 14px 16px;
      border-bottom: 1px solid var(--border-subtle);
      .avatar-large {
        font-size: 2.2rem;
        background: var(--accent-primary);
        width: 58px;
        height: 58px;
        line-height: 58px;
        margin: 0 auto 10px;
        border-radius: 50%;
        border: 2px solid var(--accent-gold);
      }
      h3 { margin: 0 0 6px; font-size: 1.05rem; }
      .role-pill {
        font-size: 0.75rem;
        background: #121118;
        border: 1px solid var(--border-subtle);
        color: var(--accent-gold);
        padding: 2px 8px;
        border-radius: 12px;
        font-weight: 600;
      }
    }
    .side-menu {
      display: flex;
      flex-direction: column;
      padding: 12px;
      gap: 4px;
      a {
        padding: 10px 12px;
        border-radius: 8px;
        color: var(--text-muted);
        text-decoration: none;
        cursor: pointer;
        transition: 0.2s;
        &.active, &:hover {
          color: var(--text-main);
          background: rgba(74, 67, 99, 0.4);
        }
      }
      .admin-link { color: var(--accent-gold); }
    }
    .create-post-card { padding: 18px; margin-bottom: 24px; }
    .create-top {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
      .creator-avatar { font-size: 1.8rem; }
      textarea {
        flex: 1;
        background: #121118;
        border: 1px solid var(--border-subtle);
        border-radius: 10px;
        color: var(--text-main);
        padding: 12px;
        font-size: 0.95rem;
        outline: none;
        resize: vertical;
        &:focus { border-color: var(--accent-gold); }
      }
    }
    .media-preview-container {
      margin-bottom: 14px;
      .preview-box {
        position: relative;
        display: inline-block;
        max-width: 100%;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid var(--border-subtle);
        img, video { max-height: 240px; display: block; border-radius: 10px; }
        .remove-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(18, 17, 24, 0.85);
          color: white;
          border: 1px solid var(--border-subtle);
          border-radius: 50%;
          width: 26px;
          height: 26px;
          cursor: pointer;
        }
      }
    }
    .create-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--border-subtle);
      padding-top: 12px;
    }
    .media-btn { color: var(--accent-gold); font-size: 0.88rem; cursor: pointer; font-weight: 500; }
    .file-name { margin-left: 10px; font-size: 0.8rem; color: var(--text-muted); }
    .posts-stream { display: flex; flex-direction: column; gap: 20px; }
    .post-card { padding: 20px; }
    .post-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .author-info {
      display: flex;
      align-items: center;
      gap: 10px;
      .author-avatar {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: var(--accent-primary);
        display: grid;
        place-items: center;
        font-weight: bold;
        color: var(--accent-gold);
      }
      .author-name {
        color: var(--text-main);
        font-weight: 600;
        text-decoration: none;
        display: block;
        &:hover { color: var(--accent-gold); }
      }
      .post-date { font-size: 0.78rem; color: var(--text-muted); }
    }
    .action-link {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 0.82rem;
      margin-left: 8px;
      &.delete { color: var(--danger); }
      &.report { color: var(--text-muted); &:hover { color: var(--accent-gold); } }
    }
    .post-text { font-size: 0.98rem; line-height: 1.5; margin: 0 0 14px; white-space: pre-wrap; }
    .post-media {
      margin-bottom: 14px;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--border-subtle);
      img, video { width: 100%; max-height: 480px; object-fit: cover; display: block; }
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
        transition: 0.2s;
        &:hover { color: var(--text-main); }
        &.liked { color: var(--accent-gold); font-weight: 600; }
      }
    }
    .comments-section {
      margin-top: 14px;
      border-top: 1px dashed var(--border-subtle);
      padding-top: 12px;
      .comments-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
      .comment-item {
        font-size: 0.88rem;
        background: #121118;
        padding: 8px 12px;
        border-radius: 8px;
        border: 1px solid var(--border-subtle);
        position: relative;
        .del-comment-btn {
          position: absolute;
          right: 8px;
          top: 8px;
          background: none;
          border: none;
          color: var(--danger);
          cursor: pointer;
          font-size: 0.75rem;
        }
      }
      .no-comments { font-size: 0.82rem; color: var(--text-muted); }
      .comment-input-row {
        display: flex;
        gap: 8px;
        input {
          flex: 1;
          background: #121118;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          padding: 8px 12px;
          color: var(--text-main);
          font-size: 0.88rem;
          outline: none;
          &:focus { border-color: var(--accent-gold); }
        }
      }
    }
    .empty-state {
      text-align: center;
      padding: 48px 20px;
      .mascot-empty { font-size: 3rem; display: block; margin-bottom: 12px; }
      h3 { margin-bottom: 6px; }
      p { color: var(--text-muted); font-size: 0.9rem; margin: 0; }
    }
    .sidebar-right { padding: 20px; h4 { margin: 0 0 12px; font-size: 1rem; } }
    .tags-cluster {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      .tag {
        background: #121118;
        border: 1px solid var(--border-subtle);
        padding: 4px 10px;
        border-radius: 14px;
        font-size: 0.8rem;
        color: var(--accent-gold);
      }
    }
    @media (max-width: 960px) {
      .feed-layout { grid-template-columns: 1fr; }
      .sidebar-left, .sidebar-right { display: none; }
    }
  `]
})
export class CommunityFeedComponent implements OnInit {
  authService = inject(AuthService);
  feedback = inject(FeedbackService);
  postService = inject(PostService);
  private platformId = inject(PLATFORM_ID);

  // Reactive Signals for instant UI updates in Angular 22
  feedMode = signal<'subscribed' | 'all'>('all');
  posts = signal<PostItem[]>([]);
  loading = signal<boolean>(false);
  submitting = signal<boolean>(false);

  newPostContent = '';
  selectedFile: File | null = null;
  mediaPreviewUrl = signal<string | null>(null);
  mediaPreviewType = signal<'IMAGE' | 'VIDEO' | null>(null);

  openCommentsPostId = signal<number | null>(null);
  activeComments = signal<CommentItem[]>([]);
  newCommentText = '';

  get currentUser() {
    return this.authService.currentUser();
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadPosts();
    }
  }

  setMode(mode: 'subscribed' | 'all'): void {
    this.feedMode.set(mode);
    this.loadPosts();
  }

  loadPosts(): void {
    this.loading.set(true);

    const req$ = this.feedMode() === 'subscribed' 
      ? this.postService.getFeed() 
      : this.postService.getPublicPosts();

    req$.pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (data) => {
        this.posts.set(data || []);
      },
      error: (err) => {
        this.feedback.showError(err.error?.message || 'Failed to load posts');
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.mediaPreviewType.set(file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE');
      this.mediaPreviewUrl.set(URL.createObjectURL(file));
      this.feedback.showSuccess(`Attached: ${file.name}`);
    }
  }

  removeSelectedMedia(): void {
    this.selectedFile = null;
    this.mediaPreviewUrl.set(null);
    this.mediaPreviewType.set(null);
  }

  publishPost(): void {
    if (!this.newPostContent.trim()) return;
    this.submitting.set(true);

    this.postService.createPost(this.newPostContent, this.selectedFile).pipe(
      finalize(() => this.submitting.set(false))
    ).subscribe({
      next: (created) => {
        this.posts.update(list => [created, ...list]);
        this.newPostContent = '';
        this.removeSelectedMedia();
        this.feedback.showSuccess('Post published to Woob feed!');
      },
      error: (err) => {
        this.feedback.showError(err.error?.message || 'Failed to publish post');
      }
    });
  }

  toggleLike(post: PostItem): void {
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

  isOwnerOrAdmin(post: PostItem): boolean {
    return this.currentUser?.id === post.authorId || this.authService.isAdmin();
  }

  deletePost(post: PostItem): void {
    this.feedback.confirm({
      title: 'Delete Post',
      message: 'This post and all associated comments will be permanently removed. Are you sure?',
      confirmText: 'Delete',
      isDestructive: true
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.postService.deletePost(post.id).subscribe({
          next: () => {
            this.posts.update(list => list.filter(p => p.id !== post.id));
            this.feedback.showSuccess('Post deleted successfully');
          },
          error: (err) => this.feedback.showError(err.error?.message || 'Failed to delete post')
        });
      }
    });
  }

  reportPost(post: PostItem): void {
    const reason = prompt('Please enter the reason for reporting this post:');
    if (!reason || !reason.trim()) return;

    this.feedback.confirm({
      title: 'Submit Report',
      message: `Are you sure you want to report @${post.authorUsername}'s post for: "${reason}"?`,
      confirmText: 'Submit Report',
      isDestructive: false
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.postService.reportUser(post.authorId, reason, post.id).subscribe({
          next: () => this.feedback.showSuccess('Report submitted to administrators for review'),
          error: (err) => this.feedback.showError(err.error?.message || 'Report submission failed')
        });
      }
    });
  }
}
