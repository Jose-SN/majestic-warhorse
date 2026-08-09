import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router, RouterModule } from '@angular/router';
import { BrandingService } from 'src/app/core/branding/branding.service';
import { DASHBOARD_NAV_ROUTES } from 'src/app/pages/dashboard/dashboard-routes.config';

@Component({
  selector: 'app-how-it-works-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './how-it-works-page.component.html',
  styleUrl: './how-it-works-page.component.scss',
})
export class HowItWorksPageComponent implements OnInit {
  readonly embedUrl: SafeResourceUrl;
  appName = 'PetaxAI Learning';
  isLoggedIn = false;

  constructor(
    private sanitizer: DomSanitizer,
    private brandingService: BrandingService,
    private router: Router,
    private location: Location
  ) {
    this.embedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'assets/screens/how-it-works.html?embed=1'
    );
  }

  ngOnInit(): void {
    this.isLoggedIn = sessionStorage.getItem('isAuthenticated') === 'true';
    this.appName = this.brandingService.appName || this.appName;
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
}
