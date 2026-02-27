import { Component, OnInit } from '@angular/core';
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

  constructor(public fetchApiData: FetchApiDataService) {}

  ngOnInit(): void {
    this.loadUserAndFavorites();
  }

  private getStoredUsername(): string | null {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    return storedUser?.Username ?? null;
  }

  private getMovieId(movie: any): string {
    return movie?._id?.$oid ?? movie?._id;
  }

  private loadUserAndFavorites(): void {
    const username = this.getStoredUsername();
    console.log('[Profile] stored username:', username);

    if (!username) return;

    forkJoin({
      user: this.fetchApiData.getUser(username).pipe(
        catchError((err) => {
          console.log('[Profile] getUser failed:', err);
          return of(null);
        })
      ),
      movies: this.fetchApiData.getAllMovies().pipe(
        catchError((err) => {
          console.log('[Profile] getAllMovies failed:', err);
          return of([]);
        })
      )
    }).subscribe({
      next: ({ user, movies }) => {
        if (!user) return;

        this.user = user;
        localStorage.setItem('user', JSON.stringify(user));
        this.allMovies = movies as any[];

        console.log('[Profile] USER FROM API:', user);
        console.log('[Profile] USER.FavoriteMovies:', user?.FavoriteMovies);

        this.editData = {
          Username: user.Username || '',
          Password: '',
          Email: user.Email || '',
          Birthday: (user.Birthday || '').slice(0, 10)
        };

        const favIds: string[] = (user.FavoriteMovies || []).map((x: any) => String(x));

        this.favoriteMovies = (this.allMovies || []).filter((m: any) => {
          const id = String(this.getMovieId(m));
          return favIds.includes(id);
        });

        console.log('[Profile] favIds:', favIds);
        console.log('[Profile] matched favorites:', this.favoriteMovies.map(m => this.getMovieId(m)));
      },
      error: (err) => console.log('[Profile] forkJoin failed:', err)
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
        console.log('[Profile] updated user:', updatedUser);
        this.user = updatedUser;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        alert('Profile updated!');
        this.loadUserAndFavorites();
      },
      error: (err) => {
        console.log(err);
        alert('Update failed.');
      }
    });
  }

  removeFromFavorites(movie: any): void {
    const username = this.user?.Username;
    const movieId = this.getMovieId(movie);

    console.log('[Profile] removing favorite', { username, movieId });

    if (!username || !movieId) return;

    this.fetchApiData.deleteFavouriteMovie(username, movieId).subscribe({
      next: (updatedUser: any) => {
        console.log('[Profile] UPDATED USER AFTER REMOVE:', updatedUser);
        console.log('[Profile] UPDATED FAVORITES AFTER REMOVE:', updatedUser?.FavoriteMovies);

        this.user = updatedUser;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        this.loadUserAndFavorites();
      },
      error: (err) => console.log(err)
    });
  }
}