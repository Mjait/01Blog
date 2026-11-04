import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PostItem {
  id: number;
  authorId: number;
  authorUsername: string;
  authorAvatarUrl: string | null;
  content: string;
  mediaUrl: string | null;
  mediaType: 'IMAGE' | 'VIDEO' | null;
  hidden: boolean;
  likesCount: number;
  commentsCount: number;
  likedByCurrentUser: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommentItem {
  id: number;
  postId: number;
  authorId: number;
  authorUsername: string;
  authorAvatarUrl: string | null;
  content: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api';

  getFeed(): Observable<PostItem[]> {
    return this.http.get<PostItem[]>(`${this.baseUrl}/posts/feed`);
  }

  getPublicPosts(): Observable<PostItem[]> {
    return this.http.get<PostItem[]>(`${this.baseUrl}/posts`);
  }

  createPost(content: string, file: File | null): Observable<PostItem> {
    const formData = new FormData();
    formData.append('content', content);
    if (file) {
      formData.append('file', file);
    }
    return this.http.post<PostItem>(`${this.baseUrl}/posts`, formData);
  }

  deletePost(postId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/posts/${postId}`);
  }

  likePost(postId: number): Observable<PostItem> {
    return this.http.post<PostItem>(`${this.baseUrl}/posts/${postId}/like`, {});
  }

  unlikePost(postId: number): Observable<PostItem> {
    return this.http.delete<PostItem>(`${this.baseUrl}/posts/${postId}/like`);
  }

  getComments(postId: number): Observable<CommentItem[]> {
    return this.http.get<CommentItem[]>(`${this.baseUrl}/posts/${postId}/comments`);
  }

  addComment(postId: number, content: string): Observable<CommentItem> {
    return this.http.post<CommentItem>(`${this.baseUrl}/posts/${postId}/comments`, { content });
  }

  deleteComment(commentId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/comments/${commentId}`);
  }

  reportUser(userId: number, reason: string, postId?: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/users/${userId}/report`, { reason, reportedPostId: postId });
  }
}