import { Component, inject, OnInit, OnDestroy, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { FeedbackService } from '../../services/feedback.service';
import { NotificationService, NotificationItem } from '../../../core/services/notification.service';
import { MascotComponent } from '../mascot/mascot.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MascotComponent],
  template: `
    <header class="navbar-wrapper">
      <div class="nav-container">
        <!-- Logo & Mascot Brand -->
        <a routerLink="/feed" class="brand-link" title="Woob Community">
          <div class="mascot-badge">
            <app-mascot [expression]="'happy'" [size]="34" [showAccents]="false" [interactive]="true"></app-mascot>
          </div>
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
          <!-- Theme Toggle (Bonus Requirement) -->
          <button class="icon-btn theme-toggle" (click)="toggleTheme()" [title]="isDarkMode() ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
            {{ isDarkMode() ? '☀️' : '🌙' }}
          </button>

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
                    <app-mascot [expression]="'curious'" [size]="52" [showAccents]="false"></app-mascot>
                    <p style="margin: 8px 0 0;">No notifications yet</p>
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
      background: var(--navbar-bg);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border-bottom: 1px solid var(--navbar-border);
      box-shadow: var(--navbar-shadow);
      position: sticky;
      top: 0;
      z-index: 1000;
      padding: 10px 20px;
      transition: background-color 0.25s ease, border-color 0.2s ease, box-shadow 0.25s ease;
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
      width: 38px;
      height: 38px;
      display: grid;
      place-items: center;
      border-radius: 12px;
      transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      &:hover {
        transform: scale(1.1) rotate(-4deg);
      }
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
        background: var(--bg-input);
        border: 1px solid var(--border-input);
        border-radius: 20px;
        padding: 8px 16px 8px 38px;
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
      .search-icon {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-muted);
        opacity: 0.8;
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
        background: var(--bg-hover);
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
      transition: background-color 0.2s ease;
      &:hover { background: var(--bg-hover); }
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
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      box-shadow: var(--card-shadow);
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
      background: var(--bg-input);
      border: 1px solid var(--border-subtle);
      transition: 0.2s;
      &.unread {
        border-color: var(--accent-gold);
        background: var(--bg-subtle);
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
      background: var(--bg-input);
      border: 1px solid var(--border-subtle);
      transition: border-color 0.2s;
      &:hover { border-color: var(--accent-gold); }
      .user-avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: var(--accent-primary);
        display: grid;
        place-items: center;
        font-weight: bold;
        font-size: 0.85rem;
        color: #FFFFFF;
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
      transition: all 0.2s;
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
export class NavbarComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  feedback = inject(FeedbackService);
  notifService = inject(NotificationService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private pollingSub?: Subscription;

  isDarkMode = signal<boolean>(true);
  unreadCount = signal<number>(0);
  notifications = signal<NotificationItem[]>([]);
  dropdownOpen = signal<boolean>(false);
  searchQuery = '';

  get currentUser() {
    return this.authService.currentUser();
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // 1. Initialize Dark/Light theme
      const savedTheme = localStorage.getItem('woob_theme') || 'dark';
      this.isDarkMode.set(savedTheme === 'dark');
      document.documentElement.setAttribute('data-theme', savedTheme);

      // 2. Initial unread check & auto-refresh polling (Real-Time Bonus)
      if (this.authService.isAuthenticated()) {
        this.refreshUnreadCount();
        this.pollingSub = interval(25000).subscribe(() => this.refreshUnreadCount());
      }
    }
  }

  ngOnDestroy(): void {
    this.pollingSub?.unsubscribe();
  }

  toggleTheme(): void {
    const nextDark = !this.isDarkMode();
    this.isDarkMode.set(nextDark);
    const themeName = nextDark ? 'dark' : 'light';
    if (isPlatformBrowser(this.platformId)) {
      document.documentElement.setAttribute('data-theme', themeName);
      localStorage.setItem('woob_theme', themeName);
    }
    this.feedback.showSuccess(nextDark ? 'Switched to Midnight Slate (Dark)' : 'Switched to Clean Linen (Light)');
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
