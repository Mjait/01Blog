import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FeedbackService } from '../../services/feedback.service';

export interface ReportModalData {
  targetUsername: string;
  targetUserId: number;
  postId?: number;
}

@Component({
  selector: 'app-report-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  template: `
    <div class="report-modal-card">
      <div class="modal-header">
        <span class="mascot-icon">🧶</span>
        <h3>Report @{{ data.targetUsername }}</h3>
        <p class="subtitle" *ngIf="data.postId">Reporting Post #{{ data.postId }}</p>
        <p class="subtitle" *ngIf="!data.postId">Reporting User Profile</p>
      </div>

      <div class="modal-body">
        <label>Reason for report (required, min 5 characters)</label>
        <textarea
          [(ngModel)]="reason"
          rows="4"
          placeholder="Describe why this content or profile violates community guidelines..."
        ></textarea>
        <div class="error-msg" *ngIf="touched && reason.trim().length < 5">
          Please provide a clear reason (at least 5 characters).
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn-steel" (click)="close()">Cancel</button>
        <button class="btn-danger" (click)="submit()">Submit Report</button>
      </div>
    </div>
  `,
  styles: [`
    .report-modal-card {
      background: var(--bg-card);
      color: var(--text-main);
      padding: 24px;
      border-radius: 16px;
      border: 1px solid var(--border-subtle);
      min-width: 360px;
    }
    .modal-header {
      text-align: center;
      margin-bottom: 18px;
      .mascot-icon {
        font-size: 2.2rem;
        display: inline-block;
        margin-bottom: 6px;
      }
      h3 { margin: 0; font-size: 1.25rem; }
      .subtitle { color: var(--text-muted); font-size: 0.85rem; margin: 4px 0 0; }
    }
    .modal-body {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 20px;
      label {
        font-size: 0.85rem;
        color: var(--text-muted);
      }
      textarea {
        background: #121118;
        border: 1px solid var(--border-subtle);
        border-radius: 10px;
        color: var(--text-main);
        padding: 12px;
        font-size: 0.92rem;
        outline: none;
        resize: vertical;
        &:focus { border-color: var(--accent-gold); }
      }
      .error-msg {
        color: #ff6b6b;
        font-size: 0.8rem;
      }
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
  `]
})
export class ReportModalComponent {
  feedback = inject(FeedbackService);
  reason = '';
  touched = false;

  constructor(
    public dialogRef: MatDialogRef<ReportModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ReportModalData
  ) {}

  close(): void {
    this.dialogRef.close(null);
  }

  submit(): void {
    this.touched = true;
    const trimmed = this.reason.trim();
    if (trimmed.length < 5) return;

    this.feedback.confirm({
      title: 'Confirm Report Submission',
      message: `Are you sure you want to submit this report against @${this.data.targetUsername}?`,
      confirmText: 'Yes, Submit',
      isDestructive: true
    }).subscribe(confirmed => {
      if (confirmed) {
        this.dialogRef.close(trimmed);
      }
    });
  }
}
