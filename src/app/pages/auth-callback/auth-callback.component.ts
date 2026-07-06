import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OAuthService } from 'src/app/core/auth/oauth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auth-callback.component.html',
  styleUrl: './auth-callback.component.scss',
})
export class AuthCallbackComponent implements OnInit {
  public loading = true;
  public errorMessage = '';

  constructor(
    private oauthService: OAuthService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      await this.oauthService.handleGoogleCallback();
    } catch (error: any) {
      this.loading = false;
      this.errorMessage =
        error?.message || 'Something went wrong while signing you in. Please try again.';
    }
  }

  backToLogin(): void {
    this.router.navigate(['/login']);
  }
}
