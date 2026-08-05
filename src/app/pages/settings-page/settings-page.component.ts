import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { DASHBOARD_NAV_ROUTES } from 'src/app/pages/dashboard/dashboard-routes.config';
import { CommonService } from 'src/app/shared/services/common.service';
import { AccountSettingsComponent } from '../account-settings/account-settings.component';
import { CustomizeAppComponent } from '../customize-app/customize-app.component';

export type SettingsTab = 'account' | 'customize';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [AccountSettingsComponent, CustomizeAppComponent],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.scss',
})
export class SettingsPageComponent implements OnInit, OnDestroy {
  activeTab: SettingsTab = 'account';
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private commonService: CommonService
  ) {}

  get showCustomizeTab(): boolean {
    return this.commonService.loginedUserInfo?.role === 'organization';
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const tab = params.get('tab') as SettingsTab | null;
      const defaultTab: SettingsTab = 'account';

      if (!tab) {
        void this.router.navigate([DASHBOARD_NAV_ROUTES.settings, defaultTab], { replaceUrl: true });
        return;
      }

      if (tab === 'customize') {
        if (!this.showCustomizeTab) {
          void this.router.navigate([DASHBOARD_NAV_ROUTES.settings, defaultTab], { replaceUrl: true });
          return;
        }
        this.activeTab = 'customize';
        return;
      }

      if (tab === 'account') {
        this.activeTab = 'account';
        return;
      }

      void this.router.navigate([DASHBOARD_NAV_ROUTES.settings, defaultTab], { replaceUrl: true });
    });
  }

  setTab(tab: SettingsTab): void {
    if (tab === 'customize' && !this.showCustomizeTab) {
      return;
    }
    if (this.activeTab === tab) {
      return;
    }
    void this.router.navigate([DASHBOARD_NAV_ROUTES.settings, tab]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
