import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CommonService } from 'src/app/shared/services/common.service';
import {
  DASHBOARD_NAV_ROUTES,
} from 'src/app/pages/dashboard/dashboard-routes.config';
import { TeachersListComponent } from '../teachers-list/teachers-list.component';
import { StudentsListComponent } from '../students-list/students-list.component';

export type DirectoryTab = 'teachers' | 'students';

@Component({
  selector: 'app-directory-page',
  standalone: true,
  imports: [TeachersListComponent, StudentsListComponent],
  templateUrl: './directory-page.component.html',
  styleUrl: './directory-page.component.scss',
})
export class DirectoryPageComponent implements OnInit, OnDestroy {
  activeTab: DirectoryTab = 'teachers';
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public commonService: CommonService
  ) {}

  get loginedUserPrivilege(): string {
    return this.commonService.loginedUserInfo?.role || '';
  }

  get showTeachersTab(): boolean {
    return this.loginedUserPrivilege === 'organization';
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const tab = params.get('tab') as DirectoryTab | null;
      const defaultTab = this.getDefaultTab();

      if (!tab) {
        void this.router.navigate([DASHBOARD_NAV_ROUTES.directory, defaultTab], { replaceUrl: true });
        return;
      }

      if (tab === 'students') {
        this.activeTab = 'students';
        return;
      }

      if (tab === 'teachers' && this.showTeachersTab) {
        this.activeTab = 'teachers';
        return;
      }

      if (tab !== defaultTab) {
        void this.router.navigate([DASHBOARD_NAV_ROUTES.directory, defaultTab], { replaceUrl: true });
        return;
      }

      this.activeTab = defaultTab;
    });
  }

  setTab(tab: DirectoryTab): void {
    if (tab === 'teachers' && !this.showTeachersTab) {
      return;
    }

    if (this.activeTab === tab) {
      return;
    }

    void this.router.navigate([DASHBOARD_NAV_ROUTES.directory, tab]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getDefaultTab(): DirectoryTab {
    return this.showTeachersTab ? 'teachers' : 'students';
  }
}
