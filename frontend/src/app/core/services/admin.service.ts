import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { PostItem } from './post.service';

export interface AdminUserItem {
  id: number;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  banned: boolean;
  followersCount: number;
  postsCount: number;
  createdAt: string;
}

export interface ReportItem {
  id: number;
  reporterId: number;
  reporterUsername: string;
  reportedUserId: number;
  reportedUsername: string;
  reportedPostId: number | null;
  reason: string;
  status?: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  resolved?: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api/admin';

  getAllUsers(): Observable<AdminUserItem[]> {
    return this.http.get<AdminUserItem[]>(`${this.baseUrl}/users`);
  }

  banUser(userId: number): Observable<AdminUserItem> {
    return this.http.patch<AdminUserItem>(`${this.baseUrl}/users/${userId}/ban?banned=true`, {});
  }

  unbanUser(userId: number): Observable<AdminUserItem> {
    return this.http.patch<AdminUserItem>(`${this.baseUrl}/users/${userId}/ban?banned=false`, {});
  }

  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/users/${userId}`);
  }

  getAllReports(): Observable<ReportItem[]> {
    return this.http.get<ReportItem[]>(`${this.baseUrl}/reports`);
  }

  resolveReport(reportId: number, status: 'RESOLVED' | 'DISMISSED'): Observable<ReportItem> {
    return this.http.patch<ReportItem>(`${this.baseUrl}/reports/${reportId}?status=${status}`, {});
  }

  getAllPosts(): Observable<PostItem[]> {
    return this.http.get<PostItem[]>(`${this.baseUrl}/posts`);
  }

  hidePost(postId: number): Observable<PostItem> {
    return this.http.patch<PostItem>(`${this.baseUrl}/posts/${postId}/hide`, {});
  }

  unhidePost(postId: number): Observable<PostItem> {
    return this.http.patch<PostItem>(`${this.baseUrl}/posts/${postId}/unhide`, {});
  }

  deletePost(postId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/posts/${postId}`);
  }
}
