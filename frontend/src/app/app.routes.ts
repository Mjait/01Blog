import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'feed', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { 
    path: 'feed', 
    canActivate: [authGuard],
    loadComponent: () => import('./features/feed/community-feed/community-feed').then(m => m.CommunityFeedComponent)
  },
  { 
    path: 'profile/:id', 
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/user-profile/user-profile').then(m => m.UserProfileComponent)
  },
  { path: '**', redirectTo: 'feed' }
];
