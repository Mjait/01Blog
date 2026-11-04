import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { FeedbackService } from '../../services/feedback.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
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
          <input type="text" placeholder="Search threads, tags, creators..." />
        </div>

        <!-- Navigation Links & User Actions -->
        <nav class="nav-actions">
          <ng-container *ngIf="authService.isAuthenticated(); else guestLinks">
            <a routerLink="/feed" routerLinkActive="active" class="nav-btn">Feed</a>
            
            <a *ngIf="authService.isAdmin()" routerLink="/admin" routerLinkActive="active" class="nav-btn admin-badge">
              🛡️ Admin
            </a>

            <!-- Notification Bell -->
            <button class="icon-btn" title="Notifications">
              🔔
              <span class="badge" *ngIf="unreadCount > 0">{{ unreadCount }}</span>
            </button>

            <!-- User Profile Dropdown / Trigger -->
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
      background: rgba(30, 27, 36, 0.9);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-subtle);
      position: sticky;
      top: 0;
      z-index: 1000;
      padding: 10px 24px;
    }
    .nav-container {
      max-width: 1280px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
    }
    .brand-link {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: var(--text-main);
    }
    .mascot-badge {
      font-size: 1.6rem;
      background: var(--accent-primary);
      width: 40px;
      height: 40px;
      display: grid;
      place-items: center;
      border-radius: 12px;
      border: 1px solid rgba(200, 169, 81, 0.3);
    }
    .brand-name {
      font-size: 1.4rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: var(--text-main);
    }
    .search-box {
      flex: 1;
      max-width: 460px;
      position: relative;
      input {
        width: 100%;
        background: #121118;
        border: 1px solid var(--border-subtle);
        border-radius: 20px;
        padding: 9px 16px 9px 40px;
        color: var(--text-main);
        font-size: 0.9rem;
        outline: none;
        transition: border-color 0.2s;
        &:focus {
          border-color: var(--accent-gold);
        }
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
      gap: 16px;
    }
    .nav-btn {
      color: var(--text-muted);
      text-decoration: none;
      font-weight: 500;
      font-size: 0.95rem;
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
    .icon-btn {
      position: relative;
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      color: var(--text-main);
      &:hover {
        background: rgba(255, 255, 255, 0.05);
      }
      .badge {
        position: absolute;
        top: 2px;
        right: 2px;
        background: var(--danger);
        color: white;
        font-size: 0.7rem;
        padding: 2px 6px;
        border-radius: 10px;
        font-weight: bold;
      }
    }
    .user-pill {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      padding: 4px 10px 4px 4px;
      border-radius: 20px;
      background: #121118;
      border: 1px solid var(--border-subtle);
      .user-avatar {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: var(--accent-primary);
        display: grid;
        place-items: center;
        font-weight: bold;
        color: var(--accent-gold);
      }
      .username {
        color: var(--text-main);
        font-size: 0.9rem;
        font-weight: 500;
      }
    }
    .logout-btn {
      background: transparent;
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.85rem;
      cursor: pointer;
      &:hover {
        background: var(--danger);
        color: white;
        border-color: var(--danger);
      }
    }
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);
  feedback = inject(FeedbackService);

  unreadCount = 2;

  get currentUser() {
    return this.authService.currentUser();
  }

  logout(): void {
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
