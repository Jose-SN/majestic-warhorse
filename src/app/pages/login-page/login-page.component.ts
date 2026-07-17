import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { LoginService } from './login.service';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { Subject } from 'rxjs';
import { CommonService } from 'src/app/shared/services/common.service';
import { OAuthService } from 'src/app/core/auth/oauth.service';
import { TOASTER_MESSAGE_TYPE } from 'src/app/shared/toaster/toaster-info';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent implements OnInit, OnDestroy {
  public loginForm!: FormGroup;
  public isGoogleLoading = false;
  public heroTransform = 'scale(1.05)';
  private destroy$ = new Subject<void>();
  constructor(
    private formBuilder: FormBuilder,
    private loginService: LoginService,
    private router: Router,
    private authService: AuthService,
    private oauthService: OAuthService,
    private commonService: CommonService
  ) {}
  ngOnInit(): void {
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
