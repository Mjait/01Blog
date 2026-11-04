import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { FeedbackService } from '../../../shared/services/feedback.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="woob-card auth-card">
        <!-- Woob Mascot Badge -->
        <div class="mascot-header">
          <div class="mascot-sphere">🧶</div>
          <h2>Welcome back!</h2>
          <p class="subtitle">Enter your credentials to enter Woob</p>
        </div>

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="auth-form">
          <div class="form-group">
            <label>Username or Email</label>
            <input 
              type="text" 
              name="usernameOrEmail" 
              [(ngModel)]="credentials.usernameOrEmail" 
              required 
              placeholder="e.g. alice or alice@01blog.com" 
            />
          </div>

          <div class="form-group">
            <label>Password</label>
            <input 
              type="password" 
              name="password" 
              [(ngModel)]="credentials.password" 
              required 
              placeholder="••••••••" 
            />
          </div>

          <button type="submit" class="btn-gold submit-btn" [disabled]="loading || !loginForm.form.valid">
            <span *ngIf="!loading">Sign In</span>
            <span *ngIf="loading">Signing in...</span>
          </button>
        </form>

        <div class="auth-footer">
          <span>New to Woob?</span>
          <a routerLink="/register">Create an Account</a>
        </div>
        
        <div class="secure-tag">
          🔒 Secure JWT Auth & BCrypt
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: calc(100vh - 75px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .auth-card {
      width: 100%;
      max-width: 420px;
      padding: 36px 32px;
      text-align: center;
    }
    .mascot-header {
      margin-bottom: 24px;
      .mascot-sphere {
        font-size: 3rem;
        background: var(--accent-primary);
        width: 72px;
        height: 72px;
        line-height: 72px;
        margin: 0 auto 12px;
        border-radius: 50%;
        border: 2px solid var(--accent-gold);
        box-shadow: 0 4px 16px rgba(200, 169, 81, 0.25);
      }
      h2 {
        margin: 0 0 6px;
        font-size: 1.6rem;
      }
      .subtitle {
        color: var(--text-muted);
        font-size: 0.9rem;
        margin: 0;
      }
    }
    .auth-form {
      text-align: left;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      label {
        font-size: 0.85rem;
        color: var(--text-muted);
        font-weight: 500;
      }
      input {
        background: #121118;
        border: 1px solid var(--border-subtle);
        border-radius: 10px;
        padding: 12px 14px;
        color: var(--text-main);
        font-size: 0.95rem;
        outline: none;
        &:focus {
          border-color: var(--accent-gold);
        }
      }
    }
    .submit-btn {
      width: 100%;
      margin-top: 10px;
      padding: 12px;
    }
    .auth-footer {
      margin-top: 24px;
      font-size: 0.9rem;
      color: var(--text-muted);
      display: flex;
      justify-content: center;
      gap: 8px;
      a {
        color: var(--accent-gold);
        text-decoration: none;
        font-weight: 600;
        &:hover {
          text-decoration: underline;
        }
      }
    }
    .secure-tag {
      margin-top: 20px;
      font-size: 0.75rem;
      color: var(--text-muted);
      opacity: 0.7;
    }
  `]
})
export class LoginComponent {
  authService = inject(AuthService);
  feedback = inject(FeedbackService);
  router = inject(Router);

  credentials = {
    usernameOrEmail: '',
    password: ''
  };

  loading = false;

  onSubmit(): void {
    this.loading = true;
    this.authService.login(this.credentials).subscribe({
      next: (user) => {
        this.loading = false;
        this.feedback.showSuccess(`Welcome back, @${user.username}!`);
        this.router.navigate(['/feed']);
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.message || 'Invalid credentials';
        this.feedback.showError(msg);
      }
    });
  }
}
