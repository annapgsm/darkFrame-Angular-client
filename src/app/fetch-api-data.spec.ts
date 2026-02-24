import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

const apiUrl = 'https://movie-api-o14j.onrender.com/';

@Injectable({
  providedIn: 'root'
})

export class FetchApiDataService {

  // Inject the HttpClient module to the constructor params
  // This will provide HttpClient to the entire class, making it available via this.http
  constructor(private http: HttpClient) {}

  // Helper: auth headers
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: 'Bearer ' + token
    });
  }

  private extractResponseData(res: any): any {
    return res || {};
  }

  private handleError(error: HttpErrorResponse): any {
    if (error.error instanceof ErrorEvent) {
      console.error('Some error occurred:', error.error.message);
    } else {
      console.error(`Error Status code ${error.status}, Error body is: ${error.error}`);
    }
    return throwError(() => new Error('Something bad happened; please try again later.'));
  }

  // 1) User registration
  public userRegistration(userDetails: any): Observable<any> {
    console.log(userDetails);
    return this.http.post(apiUrl + 'users', userDetails).pipe(
      catchError(this.handleError)
    );
  }

  // 2) User login (IMPORTANT: route must match your API)
  public userLogin(userDetails: any): Observable<any> {
    return this.http.post(apiUrl + 'login', userDetails).pipe(
      catchError(this.handleError)
    );
  }

  // 3) Get all movies
  getAllMovies(): Observable<any> {
    return this.http.get(apiUrl + 'movies', { headers: this.getAuthHeaders() }).pipe(
      map(this.extractResponseData),
      catchError(this.handleError)
    );
  }

  // 4) Get one movie (by title or id depending on your API)
  getOneMovie(movieIdOrTitle: string): Observable<any> {
    return this.http.get(apiUrl + 'movies/' + movieIdOrTitle, { headers: this.getAuthHeaders() }).pipe(
      map(this.extractResponseData),
      catchError(this.handleError)
    );
  }

  // 5) Get director
  getDirector(name: string): Observable<any> {
    return this.http.get(apiUrl + 'directors/' + name, { headers: this.getAuthHeaders() }).pipe(
      map(this.extractResponseData),
      catchError(this.handleError)
    );
  }

  // 6) Get genre
  getGenre(name: string): Observable<any> {
    return this.http.get(apiUrl + 'genres/' + name, { headers: this.getAuthHeaders() }).pipe(
      map(this.extractResponseData),
      catchError(this.handleError)
    );
  }

  // 7) Get user
  getUser(username: string): Observable<any> {
    return this.http.get(apiUrl + 'users/' + username, { headers: this.getAuthHeaders() }).pipe(
      map(this.extractResponseData),
      catchError(this.handleError)
    );
  }

  // 8) Get favourite movies for a user
  getFavouriteMovies(username: string): Observable<any> {
    return this.http.get(apiUrl + 'users/' + username, { headers: this.getAuthHeaders() }).pipe(
      map((res: any) => this.extractResponseData(res)?.FavoriteMovies ?? []),
      catchError(this.handleError)
    );
  }

  // 9) Add a movie to favourite movies
  addFavouriteMovie(username: string, movieId: string): Observable<any> {
    return this.http.post(
      apiUrl + 'users/' + username + '/movies/' + movieId,
      {},
      { headers: this.getAuthHeaders() }
    ).pipe(catchError(this.handleError));
  }

  // 10) Edit user
  editUser(username: string, userDetails: any): Observable<any> {
    return this.http.put(
      apiUrl + 'users/' + username,
      userDetails,
      { headers: this.getAuthHeaders() }
    ).pipe(catchError(this.handleError));
  }

  // 11) Delete user
  deleteUser(username: string): Observable<any> {
    return this.http.delete(
      apiUrl + 'users/' + username,
      { headers: this.getAuthHeaders() }
    ).pipe(catchError(this.handleError));
  }

  // 12) Delete a movie from favourite movies
  deleteFavouriteMovie(username: string, movieId: string): Observable<any> {
    return this.http.delete(
      apiUrl + 'users/' + username + '/movies/' + movieId,
      { headers: this.getAuthHeaders() }
    ).pipe(catchError(this.handleError));
  }
}