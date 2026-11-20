import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface NotificationItem {
  id: number;
  recipientId: number;
  actorId: number;
  actorUsername: string;
  postId: number | null;
  message: string;
  read: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api/notifications';

  getNotifications(): Observable<NotificationItem[]> {
    return this.http.get<NotificationItem[]>(this.baseUrl);
  }

  getUnreadCount(): Observable<{ unreadCount: number }> {
    return this.http.get<{ unreadCount: number }>(`${this.baseUrl}/unread-count`);
  }

  markRead(id: number, read = true): Observable<NotificationItem> {
    return this.http.patch<NotificationItem>(`${this.baseUrl}/${id}/read?read=${read}`, {}); }  markAllAsRead(): Observable<void> { return this.http.patch<void>(`${this.baseUrl}/read-all`, {});
  }
}
