import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title class="dialog-title">{{ data.title }}</h2>
      <mat-dialog-content class="dialog-content">
        <p>{{ data.message }}</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end" class="dialog-actions">
        <button class="btn-steel" (click)="onCancel()">
          {{ data.cancelText || 'Cancel' }}
        </button>
        <button [class]="data.isDestructive ? 'btn-danger' : 'btn-gold'" (click)="onConfirm()">
          {{ data.confirmText || 'Confirm' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      background: var(--bg-card);
      color: var(--text-main);
      padding: 18px;
      border-radius: 14px;
      min-width: 320px;
      border: 1px solid var(--border-subtle);
    }
    .dialog-title {
      font-size: 1.2rem;
      margin-top: 0;
      color: var(--text-main);
    }
    .dialog-content {
      color: var(--text-muted);
      font-size: 0.95rem;
      margin-bottom: 16px;
    }
    .dialog-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}