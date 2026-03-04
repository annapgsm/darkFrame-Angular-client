import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';

import { FetchApiDataService } from '../fetch-api-data';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatInputModule],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.scss'
})
export class UserProfileComponent implements OnInit {
  user: any = {};
  editData: any = { Username: '', Password: '', Email: '', Birthday: '' };

  favoriteMovies: any[] = [];
  allMovies: any[] = [];

  constructor(
    public fetchApiData: FetchApiDataService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUserAndFavorites();
  }

  private getStoredUsername(): string | null {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    return storedUser?.Username ?? null;
  }

  private normalizeId(id: any): string {
    if (!id) return '';
    if (typeof id === 'string') return id.trim();
    if (id?.$oid) return id.$oid;
    if (id?._id) return this.normalizeId(id._id);
    if (id?.id) return this.normalizeId(id.id);
    return String(id).trim();
  }

  private getMovieId(movie: any): string {
    if (!movie) return '';
    return this.normalizeId(movie._id || movie);
  }

  private loadUserAndFavorites(retryCount = 0): void {
    const username = this.getStoredUsername();
    console.log(`[Profile] === LOAD STARTED (retry ${retryCount}) === Username:`, username);

    if (!username) return;

    forkJoin({
      user: this.fetchApiData.getUser(username).pipe(
        catchError((err) => { console.error('[Profile] getUser failed:', err); return of(null); })
      ),
      movies: this.fetchApiData.getAllMovies().pipe(
        catchError((err) => { console.error('[Profile] getAllMovies failed:', err); return of([]); })
      )
    }).subscribe({
      next: ({ user, movies }) => {
        console.log('[Profile] === API DATA RECEIVED ===');

        if (!user) {
          console.log('[Profile] No user returned from API');
          return;
        }

        this.user = user;
        localStorage.setItem('user', JSON.stringify(user));
        this.allMovies = movies as any[];

        console.log('[Profile] allMovies count:', this.allMovies.length);
        if (this.allMovies.length > 0) {
          console.log('[Profile] Sample movie _id raw:', JSON.stringify(this.allMovies[0]._id));
        }

        console.log('[Profile] Raw FavoriteMovies:', JSON.stringify(user.FavoriteMovies));
        console.log('[Profile] FavoriteMovies is array?', Array.isArray(user.FavoriteMovies));
        console.log('[Profile] Number of favorites in API:', user.FavoriteMovies?.length ?? 0);

        this.editData = {
          Username: user.Username || '',
          Password: '',
          Email: user.Email || '',
          Birthday: (user.Birthday || '').slice(0, 10)
        };

        const favIds: string[] = (user.FavoriteMovies || [])
          .map((x: any) => this.normalizeId(x))
          .filter((id: string) => id.length > 0);

        console.log('[Profile] Normalized favIds:', favIds);

        this.favoriteMovies = (this.allMovies || []).filter((m: any) => {
          return favIds.includes(this.getMovieId(m));
        });

        console.log('[Profile] FINAL matched favorites count:', this.favoriteMovies.length);

        // Force Angular to update the view
        this.cdr.detectChanges();

        // Auto-retry once if nothing matched (common race condition)
        if (this.favoriteMovies.length === 0 && retryCount < 1) {
          console.log('[Profile] No matches → retrying in 600ms...');
          setTimeout(() => this.loadUserAndFavorites(retryCount + 1), 600);
        }
      },
      error: (err) => console.error('[Profile] forkJoin error:', err)
    });
  }

  updateProfile(): void {
    const username = this.user?.Username;
    if (!username) return;

    const payload: any = {
      Username: this.editData.Username,
      Email: this.editData.Email,
      Birthday: this.editData.Birthday
    };
    if (this.editData.Password?.trim()) payload.Password = this.editData.Password;

    this.fetchApiData.editUser(username, payload).subscribe({
      next: (updatedUser: any) => {
        this.user = updatedUser;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        alert('Profile updated!');
        this.loadUserAndFavorites();
      },
      error: (err) => {
        console.error(err);
        alert('Update failed.');
      }
    });
  }

  removeFromFavorites(movie: any): void {
    const username = this.user?.Username;
    const movieId = this.getMovieId(movie);

    if (!username || !movieId) return;

    // Optimistic UI update
    this.favoriteMovies = this.favoriteMovies.filter(m => this.getMovieId(m) !== movieId);
    this.cdr.detectChanges();

    this.fetchApiData.deleteFavouriteMovie(username, movieId).subscribe({
      next: (updatedUser: any) => {
        this.user = updatedUser;
        localStorage.setItem('user', JSON.stringify(updatedUser));
      },
      error: (err) => {
        console.error(err);
        this.loadUserAndFavorites(); // revert
        alert('Failed to remove from favorites.');
      }
    });
  }
}
