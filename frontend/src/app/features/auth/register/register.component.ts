import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { FeedbackService } from '../../../shared/services/feedback.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="woob-card auth-card">
        <div class="mascot-header">
          <div class="mascot-sphere">🧶</div>
          <h2>Join Woob</h2>
          <p class="subtitle">Connect and share your creations with the community</p>
        </div>

        <form (ngSubmit)="onSubmit()" #regForm="ngForm" class="auth-form">
          <div class="form-group">
            <label>Username</label>
            <input 
              type="text" 
              name="username" 
              [(ngModel)]="formData.username" 
              required 
              minlength="3"
              maxlength="30"
              placeholder="e.g. pattern_lover" 
            />
          </div>

          <div class="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              name="email" 
              [(ngModel)]="formData.email" 
              required 
              placeholder="e.g. you@domain.com" 
            />
          </div>

          <div class="form-group">
            <label>Password (min 6 characters)</label>
            <input 
              type="password" 
              name="password" 
              [(ngModel)]="formData.password" 
              required 
              minlength="6"
              placeholder="••••••••" 
            />
          </div>

          <div class="form-group">
            <label>Bio (optional)</label>
            <textarea 
              name="bio" 
              rows="2" 
              [(ngModel)]="formData.bio" 
              placeholder="Tell creators a bit about yourself..."
            ></textarea>
          </div>

          <button type="submit" class="btn-gold submit-btn" [disabled]="loading || !regForm.form.valid">
            <span *ngIf="!loading">Create Account</span>
            <span *ngIf="loading">Creating...</span>
          </button>
        </form>

        <div class="auth-footer">
          <span>Already registered?</span>
          <a routerLink="/login">Sign In</a>
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
      max-width: 440px;
      padding: 36px 32px;
      text-align: center;
    }
    .mascot-header {
      margin-bottom: 20px;
      .mascot-sphere {
        font-size: 2.8rem;
        background: var(--accent-primary);
        width: 68px;
        height: 68px;
        line-height: 68px;
        margin: 0 auto 10px;
        border-radius: 50%;
        border: 2px solid var(--accent-gold);
      }
      h2 {
        margin: 0 0 6px;
        font-size: 1.5rem;
      }
      .subtitle {
        color: var(--text-muted);
        font-size: 0.88rem;
        margin: 0;
      }
    }
    .auth-form {
      text-align: left;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
      label {
        font-size: 0.85rem;
        color: var(--text-muted);
        font-weight: 500;
      }
      input, textarea {
        background: #121118;
        border: 1px solid var(--border-subtle);
        border-radius: 10px;
        padding: 10px 14px;
        color: var(--text-main);
        font-size: 0.92rem;
        outline: none;
        resize: vertical;
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
      margin-top: 20px;
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
  `]
})
export class RegisterComponent {
  authService = inject(AuthService);
  feedback = inject(FeedbackService);
  router = inject(Router);

  formData = {
    username: '',
    email: '',
    password: '',
    bio: ''
  };

  loading = false;

  onSubmit(): void {
    this.loading = true;
    this.authService.register(this.formData).subscribe({
      next: (user) => {
        this.loading = false;
        this.feedback.showSuccess(`Welcome to Woob, @${user.username}!`);
        this.router.navigate(['/feed']);
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.message || 'Registration failed';
        this.feedback.showError(msg);
      }
    });
  }
}