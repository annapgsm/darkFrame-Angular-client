import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { FetchApiDataService } from '../fetch-api-data';
import { MovieDetailsDialogComponent } from '../movie-details-dialog/movie-details-dialog';

@Component({
  selector: 'app-movie-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule
  ],
  templateUrl: './movie-card.html',
  styleUrl: './movie-card.scss'
})
export class MovieCardComponent implements OnInit {
  movies$: Observable<any[]>;
  favoriteMovieIds: string[] = [];

  constructor(
    public fetchApiData: FetchApiDataService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef   // ← added for instant UI updates
  ) {
    this.movies$ = this.fetchApiData.getAllMovies();
  }

  ngOnInit(): void {
    this.getMovies();
  }

  private getStoredUsername(): string | null {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    return storedUser?.Username ?? null;
  }

  // === SAME ROBUST NORMALIZER AS IN PROFILE (this fixes the ID mismatch) ===
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

  getMovies(): void {
    const username = this.getStoredUsername();
    console.log('[MovieCard] getMovies() called - username:', username);

    if (username) {
      this.fetchApiData.getUser(username).subscribe({
        next: (user: any) => {
          console.log('[MovieCard] USER FROM API:', user);
          console.log('[MovieCard] Raw FavoriteMovies:', JSON.stringify(user?.FavoriteMovies));

          // Use the robust normalizer
          this.favoriteMovieIds = (user?.FavoriteMovies || [])
            .map((x: any) => this.normalizeId(x))
            .filter((id: string) => id.length > 0);

          console.log('[MovieCard] Normalized favoriteMovieIds:', this.favoriteMovieIds);
          this.cdr.detectChanges();   // force heart icons to update
        },
        error: (err) => console.error('[MovieCard] getUser failed:', err)
      });
    }

    this.movies$ = this.fetchApiData.getAllMovies();
  }

  openMovieDetailsDialog(movie: any): void {
    this.dialog.open(MovieDetailsDialogComponent, {
      data: movie,
      width: '420px'
    });
  }

  isFavorite(movie: any): boolean {
    const movieId = this.getMovieId(movie);
    return this.favoriteMovieIds.includes(movieId);
  }

  toggleFavorite(movie: any): void {
    const username = this.getStoredUsername();
    const movieId = this.getMovieId(movie);

    console.log('[MovieCard] toggle clicked for', movie?.Title, '- ID:', movieId);

    if (!username || !movieId) return;

    const currentlyFavorite = this.isFavorite(movie);

    // === OPTIMISTIC UPDATE (heart changes instantly) ===
    if (currentlyFavorite) {
      this.favoriteMovieIds = this.favoriteMovieIds.filter(id => id !== movieId);
      console.log('[MovieCard] optimistic REMOVE - new list:', this.favoriteMovieIds);
    } else {
      this.favoriteMovieIds.push(movieId);
      console.log('[MovieCard] optimistic ADD - new list:', this.favoriteMovieIds);
    }
    this.cdr.detectChanges();   // ← this makes the heart update on FIRST click

    // === ACTUAL API CALL ===
    if (currentlyFavorite) {
      this.fetchApiData.deleteFavouriteMovie(username, movieId).subscribe({
        next: (updatedUser: any) => {
          console.log('[MovieCard] REMOVE success - server list:', updatedUser?.FavoriteMovies);
          this.favoriteMovieIds = (updatedUser?.FavoriteMovies || [])
            .map((x: any) => this.normalizeId(x))
            .filter((id: string) => id.length > 0);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        },
        error: (err) => {
          console.error(err);
          this.getMovies(); // revert on error
          alert('Failed to remove from favorites.');
        }
      });
    } else {
      this.fetchApiData.addFavouriteMovie(username, movieId).subscribe({
        next: (updatedUser: any) => {
          console.log('[MovieCard] ADD success - server list:', updatedUser?.FavoriteMovies);
          this.favoriteMovieIds = (updatedUser?.FavoriteMovies || [])
            .map((x: any) => this.normalizeId(x))
            .filter((id: string) => id.length > 0);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        },
        error: (err) => {
          console.error(err);
          this.getMovies(); // revert on error
          alert('Failed to add to favorites.');
        }
      });
    }
  }
}