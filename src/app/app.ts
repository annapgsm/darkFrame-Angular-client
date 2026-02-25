import { Component } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

import { UserRegistrationFormComponent } from './user-registration-form/user-registration-form';
import { UserLoginFormComponent } from './user-login-form/user-login-form';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})

export class AppComponent {
  constructor(public dialog: MatDialog) {}

  openUserRegistrationDialog(): void {
    this.dialog.open(UserRegistrationFormComponent, { width: '280px' });
  }

  openUserLoginDialog(): void {
    this.dialog.open(UserLoginFormComponent, { width: '280px' });
  }
}