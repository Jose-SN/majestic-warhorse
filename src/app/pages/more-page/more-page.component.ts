import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DASHBOARD_NAV_ROUTES } from 'src/app/pages/dashboard/dashboard-routes.config';
import { CommonService } from 'src/app/shared/services/common.service';

export interface MoreNavItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  queryParams?: Record<string, string | boolean>;
  visible: boolean;
}

@Component({
  selector: 'app-more-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './more-page.component.html',
  styleUrl: './more-page.component.scss',
})
export class MorePageComponent {
  readonly homeRoute = DASHBOARD_NAV_ROUTES.overview;

  constructor(private commonService: CommonService) {}

  get role(): string {
    return this.commonService.loginedUserInfo?.role || '';
  }

  get isOrganization(): boolean {
    return this.role === 'organization';
  }

  get items(): MoreNavItem[] {
    return [
      {
        id: 'account',
        label: 'Account',
        icon: 'person',
        route: DASHBOARD_NAV_ROUTES.account,
        visible: true,
      },
      {
        id: 'customize',
        label: 'Customise',
        icon: 'palette',
        route: DASHBOARD_NAV_ROUTES.customizeApp,
        visible: this.isOrganization,
      },
      {
        id: 'pricing',
        label: 'Pricing',
        icon: 'payments',
        route: DASHBOARD_NAV_ROUTES.pricing,
        visible: true,
      },
      {
        id: 'library',
        label: 'Library',
        icon: 'folder_open',
        route: DASHBOARD_NAV_ROUTES.library,
        visible: true,
      },
      {
        id: 'approvals',
        label: 'Approvals',
        icon: 'verified',
        route: DASHBOARD_NAV_ROUTES.teacherApproval,
        visible: this.isOrganization,
      },
      {
        id: 'switch-org',
        label: 'Switch org',
        icon: 'swap_horiz',
        route: DASHBOARD_NAV_ROUTES.switchOrg,
        queryParams: { switch: true },
        visible: !this.isOrganization,
      },
      {
        id: 'how-it-works',
        label: 'How it works',
        icon: 'route',
        route: DASHBOARD_NAV_ROUTES.howItWorks,
        visible: true,
      },
      {
        id: 'website',
        label: 'Website',
        icon: 'language',
        route: DASHBOARD_NAV_ROUTES.website,
        visible: true,
      },
    ].filter((item) => item.visible);
  }
}
