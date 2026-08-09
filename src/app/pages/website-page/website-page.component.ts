import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { BrandingService } from 'src/app/core/branding/branding.service';
import { postBrandingToFrame } from 'src/app/core/branding/branding-embed';
import { DASHBOARD_NAV_ROUTES } from 'src/app/pages/dashboard/dashboard-routes.config';
import { CommonService } from 'src/app/shared/services/common.service';

@Component({
  selector: 'app-website-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './website-page.component.html',
  styleUrl: './website-page.component.scss',
})
export class WebsitePageComponent implements OnInit, OnDestroy {
  @ViewChild('embedFrame') embedFrame?: ElementRef<HTMLIFrameElement>;

  readonly embedUrl: SafeResourceUrl;
  appName = 'PetaxAI Learning';
  isLoggedIn = false;
  canCustomize = false;
  private destroy$ = new Subject<void>();
  private frameReady = false;

  constructor(
    private sanitizer: DomSanitizer,
    private brandingService: BrandingService,
    private router: Router,
    private location: Location,
    private commonService: CommonService
  ) {
    this.embedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'assets/screens/website.html?embed=1'
    );
  }

  ngOnInit(): void {
    this.isLoggedIn = sessionStorage.getItem('isAuthenticated') === 'true';
    this.canCustomize =
      this.isLoggedIn && this.commonService.loginedUserInfo?.role === 'organization';

    this.brandingService.branding$.pipe(takeUntil(this.destroy$)).subscribe((branding) => {
      this.appName = branding.appName || this.appName;
      if (this.frameReady) {
        this.pushBranding();
      }
    });

    window.addEventListener('message', this.onFrameMessage);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('message', this.onFrameMessage);
  }

  onFrameLoad(): void {
    this.frameReady = true;
    this.pushBranding();
  }

  private onFrameMessage = (event: MessageEvent): void => {
    if (event.origin !== window.location.origin) {
      return;
    }
    if (event.data?.type === 'mw-branding-ready') {
      this.frameReady = true;
      this.pushBranding();
    }
  };

  private pushBranding(): void {
    postBrandingToFrame(this.embedFrame?.nativeElement, this.brandingService.branding);
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }
    void this.router.navigate([this.isLoggedIn ? DASHBOARD_NAV_ROUTES.overview : '/login']);
  }

  goPrimary(): void {
    void this.router.navigate([this.isLoggedIn ? DASHBOARD_NAV_ROUTES.overview : '/login']);
  }

  goHowItWorks(): void {
    void this.router.navigate([DASHBOARD_NAV_ROUTES.howItWorks]);
  }

  goCustomize(): void {
    void this.router.navigate([DASHBOARD_NAV_ROUTES.customizeApp]);
  }
}
