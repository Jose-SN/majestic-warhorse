import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { PARTICLE_ROUTES_LIST } from './constants/common-constant';
import { CommonService } from './shared/services/common.service';
import { Subject, takeUntil } from 'rxjs';
import { IModelInfo } from './components/common-dialog/model/popupmodel';
import { CommonDialogComponent } from './components/common-dialog/common-dialog.component';
import { COMPONENT_NAME } from './constants/popup-constants';
import { FileViwerComponent } from './components/file-viwer/file-viwer.component';
import { AssignTeachersComponent } from './components/assign-teachers/assign-teachers.component';
import { ApplicationApiService } from './services/api-service/application-api.service';
import { AppContextService } from './core/app-context.service';
import { environment } from 'src/environments/environment';
import { DashboardService } from './pages/dashboard/dashboard.service';
import {
  HealthCheckService,
  ServicesHealthState,
} from './services/api-service/health-check.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'majestic-warhorse';
  public activeRouteName: string = '';
  public isDialogOpen: boolean = false;
  public healthState: ServicesHealthState | null = null;
  private destroy$ = new Subject<void>();
  @ViewChild(CommonDialogComponent) commonDialogComponent!: CommonDialogComponent;
  public popupModelInfo: IModelInfo = {} as IModelInfo;
  public PARTICLE_ROUTES_LIST: string[] = PARTICLE_ROUTES_LIST;

  constructor(
    private router: Router,
    private commonService: CommonService,
    private applicationApiService: ApplicationApiService,
    private appContext: AppContextService,
    private dashboardService: DashboardService,
    private healthCheckService: HealthCheckService
  ) {}

  ngOnInit() {
    this.healthCheckService.state$.pipe(takeUntil(this.destroy$)).subscribe((state) => {
      this.healthState = state;
    });
    // One-time health check on app load only
    this.healthCheckService.checkOnAppLoad().pipe(takeUntil(this.destroy$)).subscribe();

    this.appContext.ensureAppId().catch((error) => {
      console.error('Error loading application context:', error);
    });

    // Legacy application bootstrap (kept for compatibility)
    this.applicationApiService
      .getApplications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.data.length > 0) {
            const app = response.data.find((item: any) => item.client_id === environment.client_id);
            if (app) {
              sessionStorage.setItem('application', JSON.stringify(app));
              sessionStorage.setItem('client_id', app.client_id);
              sessionStorage.setItem('app_id', app.id);
            }
          }
        },
        error: (error) => {
          console.error('Error loading application data:', error);
        },
      });

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.activeRouteName = event?.url?.split('/')?.[1]?.toUpperCase();
      }
    });
    this.commonService
      .getOpenpopupModelHandle()
      .pipe(takeUntil(this.destroy$))
      .subscribe((modelInfo: IModelInfo) => {
        this.loadPopupComponent(modelInfo);
      });
    this.commonService
      .closePopupModelHandle()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.closeModel();
      });
    this.dashboardService.getAllUsers();
  }

  retryHealthCheck(): void {
    this.healthCheckService.checkAll({ force: true }).pipe(takeUntil(this.destroy$)).subscribe();
  }

  dismissHealthBanner(): void {
    this.healthCheckService.dismissBanner();
  }

  loadPopupComponent(modelInfo: IModelInfo) {
    this.commonDialogComponent.title = modelInfo.title;
    let componentName;
    switch (modelInfo.componentName) {
      case COMPONENT_NAME.FILE_VIEWER:
        componentName = FileViwerComponent;
        break;
      case COMPONENT_NAME.ASSIGN_TEACHER:
        componentName = AssignTeachersComponent;
        break;
    }
    this.commonDialogComponent.loadComponent(componentName, { popupModelInfo: modelInfo });
    this.popupModelInfo = modelInfo;
    this.isDialogOpen = true;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  closeModel() {
    this.isDialogOpen = !this.isDialogOpen;
    this.popupModelInfo = {} as IModelInfo;
  }
}
