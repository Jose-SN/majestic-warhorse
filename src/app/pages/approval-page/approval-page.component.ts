import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { DASHBOARD_NAV_ROUTES } from 'src/app/pages/dashboard/dashboard-routes.config';
import { ApprovalListComponent } from '../approval-list/approval-list.component';
import { StudentApprovalListComponent } from '../student-approval-list/student-approval-list.component';

export type ApprovalTab = 'teachers' | 'students';

@Component({
  selector: 'app-approval-page',
  standalone: true,
  imports: [ApprovalListComponent, StudentApprovalListComponent],
  templateUrl: './approval-page.component.html',
  styleUrl: './approval-page.component.scss',
})
export class ApprovalPageComponent implements OnInit, OnDestroy {
  activeTab: ApprovalTab = 'teachers';
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const tab = params.get('tab') as ApprovalTab | null;
      const defaultTab: ApprovalTab = 'teachers';

      if (!tab) {
        void this.router.navigate([DASHBOARD_NAV_ROUTES.approval, defaultTab], { replaceUrl: true });
        return;
      }

      if (tab === 'students') {
        this.activeTab = 'students';
        return;
      }

      if (tab === 'teachers') {
        this.activeTab = 'teachers';
        return;
      }

      void this.router.navigate([DASHBOARD_NAV_ROUTES.approval, defaultTab], { replaceUrl: true });
    });
  }

  setTab(tab: ApprovalTab): void {
    if (this.activeTab === tab) {
      return;
    }

    void this.router.navigate([DASHBOARD_NAV_ROUTES.approval, tab]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
