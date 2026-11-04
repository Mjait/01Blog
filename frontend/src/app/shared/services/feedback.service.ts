import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from '../components/confirm-dialog/confirm-dialog';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  constructor(
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  showSuccess(message: string): void {
    this.snackBar.open(`✓ ${message}`, 'Close', {
      duration: 3500,
      panelClass: ['toast-success'],
      horizontalPosition: 'right',
      verticalPosition: 'bottom'
    });
  }

  showError(message: string): void {
    this.snackBar.open(`✕ ${message}`, 'Close', {
      duration: 4500,
      panelClass: ['toast-error'],
      horizontalPosition: 'right',
      verticalPosition: 'bottom'
    });
  }

  confirm(data: ConfirmDialogData): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data,
      panelClass: 'custom-dialog-container',
      disableClose: true
    });
    return dialogRef.afterClosed();
  }
}