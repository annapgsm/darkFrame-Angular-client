import { Component, OnInit } from '@angular/core';
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
    private dialog: MatDialog
  ) {
    // Keep your Observable approach
    this.movies$ = this.fetchApiData.getAllMovies();
  }

  ngOnInit(): void {
    this.getMovies();
  }

  private getStoredUsername(): string | null {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    return storedUser?.Username ?? null;
  }

  private getMovieId(movie: any): string {
    // supports both shapes
    return String(movie?._id?.$oid ?? movie?._id ?? '');
  }

  getMovies(): void {
    const username = this.getStoredUsername();

    console.log('[MovieCard] getMovies() called');
    console.log('[MovieCard] stored username:', username);

    // 1) load favorites first (so hearts render right)
    if (username) {
      this.fetchApiData.getUser(username).subscribe({
        next: (user: any) => {
          console.log('[MovieCard] USER FROM API:', user);
          console.log('[MovieCard] USER.FavoriteMovies:', user?.FavoriteMovies);

          this.favoriteMovieIds = (user?.FavoriteMovies || []).map((x: any) => String(x));
          console.log('[MovieCard] favoriteMovieIds now:', this.favoriteMovieIds);
        },
        error: (err) => console.log('[MovieCard] getUser failed:', err)
      });
    }

    // 2) movies observable
    this.movies$ = this.fetchApiData.getAllMovies();
  }

  openMovieDetailsDialog(movie: any): void {
    this.dialog.open(MovieDetailsDialogComponent, {
      data: movie,
      width: '420px'
    });
  }

  // Optional: keep if you use it somewhere else
  addToFavorites(movieId: string): void {
    const username = this.getStoredUsername();
    if (!username) return;

    console.log('[MovieCard] addToFavorites()', { username, movieId });

    this.fetchApiData.addFavouriteMovie(username, String(movieId)).subscribe({
      next: (updatedUser: any) => {
        console.log('[MovieCard] UPDATED USER AFTER ADD (addToFavorites):', updatedUser);
        console.log('[MovieCard] UPDATED FAVORITES AFTER ADD:', updatedUser?.FavoriteMovies);

        this.favoriteMovieIds = (updatedUser?.FavoriteMovies || []).map((x: any) => String(x));
        localStorage.setItem('user', JSON.stringify(updatedUser));
        alert('Added to favorites!');
      },
      error: (err) => console.log('[MovieCard] addToFavorites failed:', err)
    });
  }

  isFavorite(movie: any): boolean {
    const movieId = this.getMovieId(movie);
    return this.favoriteMovieIds.includes(movieId);
  }

  toggleFavorite(movie: any): void {
    const username = this.getStoredUsername();
    const movieId = this.getMovieId(movie);

    console.log('[MovieCard] toggleFavorite clicked');
    console.log('[MovieCard] username:', username);
    console.log('[MovieCard] raw movie._id:', movie?._id);
    console.log('[MovieCard] movieId computed:', movieId);
    console.log('[MovieCard] currently favorite?', this.favoriteMovieIds.includes(movieId));

    if (!username || !movieId) return;

    if (this.isFavorite(movie)) {
      console.log('[MovieCard] removing favorite...');
      this.fetchApiData.deleteFavouriteMovie(username, movieId).subscribe({
        next: (updatedUser: any) => {
          console.log('[MovieCard] UPDATED USER AFTER REMOVE:', updatedUser);
          console.log('[MovieCard] UPDATED FAVORITES AFTER REMOVE:', updatedUser?.FavoriteMovies);

          this.favoriteMovieIds = (updatedUser?.FavoriteMovies || []).map((x: any) => String(x));
          localStorage.setItem('user', JSON.stringify(updatedUser));
        },
        error: (err) => console.log('[MovieCard] remove favorite failed:', err)
      });
    } else {
      console.log('[MovieCard] adding favorite...');
      this.fetchApiData.addFavouriteMovie(username, movieId).subscribe({
        next: (updatedUser: any) => {
          console.log('[MovieCard] UPDATED USER AFTER ADD:', updatedUser);
          console.log('[MovieCard] UPDATED FAVORITES AFTER ADD:', updatedUser?.FavoriteMovies);

          this.favoriteMovieIds = (updatedUser?.FavoriteMovies || []).map((x: any) => String(x));
          localStorage.setItem('user', JSON.stringify(updatedUser));
        },
        error: (err) => console.log('[MovieCard] add favorite failed:', err)
      });
    }
  }
}