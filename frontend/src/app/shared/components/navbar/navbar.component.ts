import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { FeedbackService } from '../../services/feedback.service';
import { NotificationService, NotificationItem } from '../../../core/services/notification.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <header class="navbar-wrapper">
      <div class="nav-container">
        <!-- Logo & Mascot Brand -->
        <a routerLink="/feed" class="brand-link">
          <div class="mascot-badge">🧶</div>
          <span class="brand-name">Woob</span>
        </a>

        <!-- Global Search -->
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            (keyup.enter)="executeSearch()"
            placeholder="Search threads, tags (#woob), creators..." 
          />
        </div>

        <!-- Navigation Links & User Actions -->
        <nav class="nav-actions">
          <ng-container *ngIf="authService.isAuthenticated(); else guestLinks">
            <a routerLink="/feed" routerLinkActive="active" class="nav-btn">Feed</a>
            
            <a *ngIf="authService.isAdmin()" routerLink="/admin" routerLinkActive="active" class="nav-btn admin-badge">
              🛡️ Admin
            </a>

            <!-- Notification Bell & Dropdown -->
            <div class="notif-wrapper">
              <button class="icon-btn" (click)="toggleNotifications()" title="Notifications">
                🔔
                <span class="badge" *ngIf="unreadCount() > 0">{{ unreadCount() }}</span>
              </button>

              <div class="notif-dropdown woob-card" *ngIf="dropdownOpen()">
                <div class="notif-header">
                  <h4>Notifications</h4>
                  <button *ngIf="unreadCount() > 0" class="mark-all-btn" (click)="markAllRead()">
                    Mark all read
                  </button>
                </div>

                <div class="notif-list">
                  <div *ngIf="notifications().length === 0" class="empty-notif">
                    No notifications yet 🧶
                  </div>

                  <div 
                    *ngFor="let n of notifications()" 
                    class="notif-item" 
                    [class.unread]="!n.read"
                  >
                    <!-- Clickable Content to Navigate -->
                    <div class="notif-main" (click)="onNotificationClick(n)">
                      <div class="notif-dot" *ngIf="!n.read"></div>
                      <div class="notif-content">
                        <p>{{ n.message }}</p>
                        <span class="notif-time">{{ n.createdAt | date:'short' }}</span>
                      </div>
                    </div>

                    <!-- Mark as Read / Unread Toggle Button -->
                    <button 
                      class="read-toggle-btn" 
                      (click)="toggleSingleRead(n, $event)" 
                      [title]="n.read ? 'Mark as unread' : 'Mark as read'">
                      {{ n.read ? '✉️' : '✓' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- User Profile Link -->
            <a [routerLink]="['/profile', currentUser?.id]" class="user-pill">
              <div class="user-avatar">
                {{ currentUser?.username?.charAt(0)?.toUpperCase() }}
              </div>
              <span class="username">{{ currentUser?.username }}</span>
            </a>

            <button class="logout-btn" (click)="logout()" title="Logout">
              Logout
            </button>
          </ng-container>

          <ng-template #guestLinks>
            <a routerLink="/login" class="nav-btn">Sign In</a>
            <a routerLink="/register" class="btn-gold">Get Started</a>
          </ng-template>
        </nav>
      </div>
    </header>
  `,
  styles: [`
    .navbar-wrapper {
      background: rgba(30, 27, 36, 0.95);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-subtle);
      position: sticky;
      top: 0;
      z-index: 1000;
      padding: 10px 20px;
    }
    .nav-container {
      max-width: 1280px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .brand-link {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: var(--text-main);
    }
    .mascot-badge {
      font-size: 1.5rem;
      background: var(--accent-primary);
      width: 38px;
      height: 38px;
      display: grid;
      place-items: center;
      border-radius: 12px;
      border: 1px solid rgba(200, 169, 81, 0.3);
    }
    .brand-name {
      font-size: 1.35rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: var(--text-main);
    }
    .search-box {
      flex: 1;
      max-width: 440px;
      position: relative;
      input {
        width: 100%;
        background: #121118;
        border: 1px solid var(--border-subtle);
        border-radius: 20px;
        padding: 8px 16px 8px 38px;
        color: var(--text-main);
        font-size: 0.88rem;
        outline: none;
        transition: border-color 0.2s;
        &:focus { border-color: var(--accent-gold); }
      }
      .search-icon {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        opacity: 0.6;
        font-size: 0.85rem;
      }
    }
    .nav-actions {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .nav-btn {
      color: var(--text-muted);
      text-decoration: none;
      font-weight: 500;
      font-size: 0.92rem;
      padding: 6px 12px;
      border-radius: 8px;
      transition: all 0.2s;
      &.active, &:hover {
        color: var(--text-main);
        background: rgba(74, 67, 99, 0.4);
      }
    }
    .admin-badge {
      border: 1px solid rgba(200, 169, 81, 0.4);
      color: var(--accent-gold);
    }
    .notif-wrapper { position: relative; }
    .icon-btn {
      position: relative;
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      padding: 6px;
      border-radius: 50%;
      color: var(--text-main);
      &:hover { background: rgba(255, 255, 255, 0.05); }
      .badge {
        position: absolute;
        top: 0;
        right: 0;
        background: var(--danger);
        color: white;
        font-size: 0.68rem;
        padding: 2px 6px;
        border-radius: 10px;
        font-weight: bold;
      }
    }
    .notif-dropdown {
      position: absolute;
      right: 0;
      top: 46px;
      width: 340px;
      max-height: 420px;
      overflow-y: auto;
      padding: 14px;
      z-index: 1200;
    }
    .notif-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 10px;
      margin-bottom: 10px;
      h4 { margin: 0; font-size: 0.92rem; }
      .mark-all-btn {
        background: none;
        border: none;
        color: var(--accent-gold);
        font-size: 0.78rem;
        cursor: pointer;
        &:hover { text-decoration: underline; }
      }
    }
    .notif-list { display: flex; flex-direction: column; gap: 8px; }
    .notif-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px;
      border-radius: 10px;
      background: #121118;
      border: 1px solid var(--border-subtle);
      transition: 0.2s;
      &.unread {
        border-color: var(--accent-gold);
        background: rgba(74, 67, 99, 0.25);
      }
    }
    .notif-main {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      cursor: pointer;
      flex: 1;
    }
    .notif-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--accent-gold);
      margin-top: 5px;
      flex-shrink: 0;
    }
    .notif-content {
      p { margin: 0 0 4px; font-size: 0.84rem; line-height: 1.35; }
      .notif-time { font-size: 0.72rem; color: var(--text-muted); }
    }
    .read-toggle-btn {
      background: none;
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
      border-radius: 6px;
      padding: 3px 6px;
      cursor: pointer;
      font-size: 0.75rem;
      margin-left: 8px;
      &:hover { color: var(--accent-gold); border-color: var(--accent-gold); }
    }
    .empty-notif { text-align: center; padding: 20px; color: var(--text-muted); font-size: 0.85rem; }
    .user-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      padding: 4px 10px 4px 4px;
      border-radius: 20px;
      background: #121118;
      border: 1px solid var(--border-subtle);
      .user-avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: var(--accent-primary);
        display: grid;
        place-items: center;
        font-weight: bold;
        font-size: 0.85rem;
        color: var(--accent-gold);
      }
      .username { color: var(--text-main); font-size: 0.88rem; font-weight: 500; }
    }
    .logout-btn {
      background: transparent;
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.82rem;
      cursor: pointer;
      &:hover {
        background: var(--danger);
        color: white;
        border-color: var(--danger);
      }
    }
    @media (max-width: 820px) {
      .search-box { display: none; }
      .user-pill .username { display: none; }
    }
  `]
})
export class NavbarComponent implements OnInit {
  authService = inject(AuthService);
  feedback = inject(FeedbackService);
  notifService = inject(NotificationService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  unreadCount = signal<number>(0);
  notifications = signal<NotificationItem[]>([]);
  dropdownOpen = signal<boolean>(false);
  searchQuery = '';

  get currentUser() {
    return this.authService.currentUser();
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId) && this.authService.isAuthenticated()) {
      this.refreshUnreadCount();
    }
  }

  refreshUnreadCount(): void {
    if (!this.authService.isAuthenticated()) return;
    this.notifService.getUnreadCount().subscribe({
      next: (res) => this.unreadCount.set(res.unreadCount),
      error: () => {}
    });
  }

  toggleNotifications(): void {
    const nextState = !this.dropdownOpen();
    this.dropdownOpen.set(nextState);
    if (nextState) {
      this.notifService.getNotifications().subscribe({
        next: (list) => {
          this.notifications.set(list);
          this.unreadCount.set(list.filter(n => !n.read).length);
        }
      });
    }
  }

  // Navigate to relevant content when clicking a notification
  onNotificationClick(n: NotificationItem): void {
    if (!n.read) {
      this.notifService.markRead(n.id, true).subscribe({
        next: (updated) => {
          this.notifications.update(list => list.map(item => item.id === n.id ? updated : item));
          this.unreadCount.set(this.notifications().filter(item => !item.read).length);
        }
      });
    }
    this.dropdownOpen.set(false);

    // Target navigation: if the notification has an associated post, navigate to it; else author profile
    if (n.postId) {
      this.router.navigate(['/feed'], { queryParams: { highlightPost: n.postId } });
    } else if (n.actorId) {
      this.router.navigate(['/profile', n.actorId]);
    }
  }

  // Toggle Read / Unread without navigating
  toggleSingleRead(n: NotificationItem, event: Event): void {
    event.stopPropagation();
    const newReadState = !n.read;
    this.notifService.markRead(n.id, newReadState).subscribe({
      next: (updated) => {
        this.notifications.update(list => list.map(item => item.id === n.id ? updated : item));
        this.unreadCount.set(this.notifications().filter(item => !item.read).length);
        this.feedback.showSuccess(newReadState ? 'Marked as read' : 'Marked as unread');
      }
    });
  }

  markAllRead(): void {
    this.notifService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.update(list => list.map(item => ({ ...item, read: true })));
        this.unreadCount.set(0);
        this.feedback.showSuccess('All notifications marked as read');
      }
    });
  }

  executeSearch(): void {
    const q = this.searchQuery.trim();
    if (q) {
      this.router.navigate(['/feed'], { queryParams: { q } });
    }
  }

  logout(): void {
    this.dropdownOpen.set(false);
    this.feedback.confirm({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out of Woob?',
      confirmText: 'Sign Out',
      isDestructive: false
    }).subscribe(confirmed => {
      if (confirmed) {
        this.authService.logout();
        this.feedback.showSuccess('Signed out successfully');
      }
    });
  }
}
