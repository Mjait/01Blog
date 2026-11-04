import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PostItem } from './post.service';

export interface UserProfile {
  id: number;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  role: 'USER' | 'ADMIN';
  followersCount: number;
  followingCount: number;
  postsCount: number;
  subscribedByCurrentUser: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api';

  getUserProfile(userId: number): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.baseUrl}/users/${userId}`);
  }

  getUserPosts(userId: number): Observable<PostItem[]> {
    return this.http.get<PostItem[]>(`${this.baseUrl}/users/${userId}/posts`);
  }

  subscribe(userId: number): Observable<UserProfile> {
    return this.http.post<UserProfile>(`${this.baseUrl}/users/${userId}/subscribe`, {});
  }

  unsubscribe(userId: number): Observable<UserProfile> {
    return this.http.delete<UserProfile>(`${this.baseUrl}/users/${userId}/subscribe`);
  }

  updatePost(postId: number, content: string, file: File | null): Observable<PostItem> {
    const formData = new FormData();
    formData.append('content', content);
    if (file) {
      formData.append('file', file);
    }
    return this.http.put<PostItem>(`${this.baseUrl}/posts/${postId}`, formData);
  }
}
