import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { LoginService } from './login.service';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { Subject, takeUntil } from 'rxjs';
import { CommonService } from 'src/app/shared/services/common.service';
import { OAuthService } from 'src/app/core/auth/oauth.service';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';
import { BrandingService } from 'src/app/core/branding/branding.service';
import { AppBranding } from 'src/app/core/branding/branding.model';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent implements OnInit, OnDestroy {
  public loginForm!: FormGroup;
  public isGoogleLoading = false;
  public heroTransform = 'scale(1.05)';
  public brandLogo = '';
  public appName = '';
  public tagline = '';
  private destroy$ = new Subject<void>();
  constructor(
    private formBuilder: FormBuilder,
    private loginService: LoginService,
    private router: Router,
    private authService: AuthService,
    private oauthService: OAuthService,
    private commonService: CommonService,
    private brandingService: BrandingService
  ) {}
  ngOnInit(): void {
    this.brandingService.branding$.pipe(takeUntil(this.destroy$)).subscribe((b) => this.applyBrand(b));
    this.applyBrand(this.brandingService.branding);

    this.loginForm = this.formBuilder.group({
      accountType: ['user', [Validators.required]],
      email: ['', Validators.required],
      password: ['', Validators.required],
    });
    if (this.authService.isLoggedIn()) {
      if (sessionStorage.getItem('needsOrgPicker') === 'true') {
        this.router.navigate(['/org-picker']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    }
  }

  private applyBrand(branding: AppBranding): void {
    this.brandLogo = this.withCacheBust(this.brandingService.displayLogoUrl(branding), branding.updatedAt);
    this.appName = branding.appName;
    this.tagline = branding.tagline;
  }

  private withCacheBust(url: string, version?: string): string {
    if (!url || url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('assets/')) {
      return url;
    }
    const stamp = version || String(Date.now());
    try {
      const parsed = new URL(url, window.location.origin);
      parsed.searchParams.set('v', stamp);
      return parsed.toString();
    } catch {
      const sep = url.includes('?') ? '&' : '?';
      return `${url}${sep}v=${encodeURIComponent(stamp)}`;
    }
  }

  onSubmit(): void {
    this.loginForm.markAllAsTouched();
    if (this.loginForm.valid) {
      const { accountType, email, password } = this.loginForm.value;
      this.loginService.login(this.destroy$, { accountType, email, password });
    }
  }
  async signInWithGoogle(): Promise<void> {
    if (this.isGoogleLoading) return;
    this.isGoogleLoading = true;
    try {
      const accountType = this.loginForm.get('accountType')?.value === 'organization'
        ? 'organization'
        : 'user';
      await this.oauthService.signInWithGoogle(accountType);
    } catch (error: any) {
      this.isGoogleLoading = false;
      this.commonService.openToaster({
        message: error?.message || 'Unable to start Google sign-in. Please try again.',
        messageType: TOASTER_MESSAGE_TYPE.ERROR,
      });
    }
  }

  gotoPage(pageName: string) {
    this.router.navigate([`/${pageName}`]);
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (window.innerWidth < 1024) return;
    const xPos = (event.clientX / window.innerWidth - 0.5) * 10;
    const yPos = (event.clientY / window.innerHeight - 0.5) * 10;
    this.heroTransform = `scale(1.05) translate(${xPos}px, ${yPos}px)`;
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
