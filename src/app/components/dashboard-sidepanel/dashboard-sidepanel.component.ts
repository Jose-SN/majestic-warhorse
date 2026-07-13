import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { DashboardService } from 'src/app/pages/dashboard/dashboard.service';
import { ISidepanel } from 'src/app/pages/dashboard/modal/dashboard-modal';
import { UserModel } from 'src/app/pages/login-page/model/user-model';
import { AppService } from 'src/app/shared/services/app.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { IModelInfo } from '../common-dialog/model/popupmodel';
import { AuthService } from 'src/app/services/api-service/auth.service';

@Component({
  selector: 'app-dashboard-sidepanel',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './dashboard-sidepanel.component.html',
  styleUrl: './dashboard-sidepanel.component.scss',
})
export class DashboardSidepanelComponent implements OnInit, OnDestroy {
  public mobMenu: boolean = false;
  public activePanel: string = '';
  public SIDE_PANEL_LIST: ISidepanel = this.dashboardService.SIDE_PANEL_LIST;
  public loginedUserPrivilege: string = '';
  public loginedUserInfo: UserModel = {} as UserModel;
  public userMenuOpen = false;
  public currentYear: number = new Date().getFullYear();
  private destroy$ = new Subject<void>();
  public showAssigningPopup: boolean = false;
  readonly brandLogo = 'assets/images/logo-majestic-hourse.svg';

  @ViewChild('userMenu') userMenuRef?: ElementRef<HTMLElement>;
  public popupModelInfo: IModelInfo = {
    title: 'Assign Teacher',
    isDynamicContent: true,
    data: null,
  } as IModelInfo;
  public assignedTo: FormControl = new FormControl([]);
  constructor(
    private dashboardService: DashboardService,
    public commonService: CommonService,
    private router: Router,
    public appService: AppService,
    public authService: AuthService
  ) {
    this.activePanel = this.SIDE_PANEL_LIST['DASHBOARD_OVERVIEW'];
    this.loginedUserPrivilege = this.commonService.loginedUserInfo?.role || '';
    this.dashboardService.sidePanelChange$.pipe(takeUntil(this.destroy$)).subscribe((activePanel: string) => {
      this.activePanel = activePanel;
    });
  }

  ngOnInit(): void {
    this.loginedUserInfo = this.commonService.loginedUserInfo ?? {};
    this.loginedUserInfo.profileImage = this.commonService.decodeUrl(
      (this.loginedUserInfo.profileImage || this.loginedUserInfo.profile_image) ?? ''
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  setActivePanel(activePanel: string) {
    if (this.disableListItems() && activePanel !== this.SIDE_PANEL_LIST['APPROVAL_PENDING']) return;
    
    const routeMap: { [key: string]: string } = {
      [this.SIDE_PANEL_LIST['DASHBOARD_OVERVIEW']]: '/dashboard/overview',
      [this.SIDE_PANEL_LIST['COURSE_LISTING']]: '/dashboard/courses',
      [this.SIDE_PANEL_LIST['ACCOUNT']]: '/dashboard/account',
      [this.SIDE_PANEL_LIST['TEACHERS_LISTING']]: '/dashboard/teachers',
      [this.SIDE_PANEL_LIST['STUDENTS_LISTING']]: '/dashboard/students',
      [this.SIDE_PANEL_LIST['TEACHER_APPROVAL']]: '/dashboard/approval',
      [this.SIDE_PANEL_LIST['STUDENT_APPROVAL']]: '/dashboard/student-approval',
      [this.SIDE_PANEL_LIST['APPROVAL_PENDING']]: '/dashboard/approval-pending',
      [this.SIDE_PANEL_LIST['ASSIGN_TEACHER']]: '/dashboard/assign-teacher',
      [this.SIDE_PANEL_LIST['INVITE_TEACHER']]: '/dashboard/invite-teacher',
      [this.SIDE_PANEL_LIST['INVITE_STUDENT']]: '/dashboard/invite-student',
      [this.SIDE_PANEL_LIST['SWITCH_ORG']]: '/org-picker',
      [this.SIDE_PANEL_LIST['ASSESMENT']]: '/dashboard/assessment',
    };

    const route = routeMap[activePanel];
    if (route) {
      if (activePanel === this.SIDE_PANEL_LIST['SWITCH_ORG']) {
        this.router.navigate(['/org-picker'], { queryParams: { switch: true } });
      } else {
        this.router.navigate([route]);
      }
      this.activePanel = activePanel;
      this.dashboardService.setSidePanelChangeValue(activePanel);
    }
  }
  navigateToHome() {
    if (this.disableListItems()) return;
    // const defaultRoute = this.commonService.adminRoleType.includes(this.loginedUserPrivilege) 
    //   ? '/dashboard/course-overview' 
    //   : '/dashboard/overview';
    this.router.navigate(['/dashboard/overview']);
  }
  disableListItems() {
    return (
      (this.loginedUserPrivilege === 'student' && this.commonService.hasAssignedTeachers === false) ||
      (this.loginedUserPrivilege === 'teacher' && this.commonService.loginedUserInfo.status === 'pending')
    );
  }

  get isOrganizationAccount(): boolean {
    return (
      sessionStorage.getItem('loginType') === 'organization' ||
      this.loginedUserInfo.role === 'organization'
    );
  }

  get userAccountTypeLabel(): string {
    return this.isOrganizationAccount ? 'Organization' : 'User';
  }

  get userDisplayName(): string {
    const info = this.loginedUserInfo;
    if (this.isOrganizationAccount) {
      return (
        info.name?.trim() ||
        sessionStorage.getItem('activeOrganizationName')?.trim() ||
        ''
      );
    }

    const first = (info.firstName || info.first_name || '').trim();
    const last = (info.lastName || info.last_name || '').trim();
    return [first, last].filter(Boolean).join(' ');
  }

  get userEmail(): string {
    return this.loginedUserInfo.email || this.loginedUserInfo.contact?.email || '';
  }

  get userPhone(): string {
    return this.loginedUserInfo.phone || this.loginedUserInfo.contact?.phone || '';
  }

  get userRoleLabel(): string {
    return this.commonService.transformText(this.loginedUserPrivilege || this.loginedUserInfo.role || '');
  }

  get hasProfileImage(): boolean {
    return !!(this.loginedUserInfo.profileImage || this.loginedUserInfo.profile_image)?.trim();
  }

  get profileImageUrl(): string {
    return (
      this.loginedUserInfo.profileImage ||
      this.loginedUserInfo.profile_image ||
      this.brandLogo
    );
  }

  get userInitial(): string {
    const source = this.userDisplayName || this.userEmail || 'U';
    return source.charAt(0).toUpperCase();
  }

  get organizationName(): string {
    const fromSession = sessionStorage.getItem('activeOrganizationName')?.trim() || '';
    if (fromSession) {
      return fromSession;
    }

    if (this.isOrganizationAccount) {
      return this.loginedUserInfo.name?.trim() || '';
    }

    return '';
  }
  get showSwitchOrganization(): boolean {
    return !this.isOrganizationAccount && this.loginedUserPrivilege !== 'organization';
  }

  toggleUserMenu(event: Event): void {
    event.stopPropagation();
    this.userMenuOpen = !this.userMenuOpen;
  }

  closeUserMenu(): void {
    this.userMenuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.userMenuOpen) {
      return;
    }

    const menu = this.userMenuRef?.nativeElement;
    if (menu && !menu.contains(event.target as Node)) {
      this.userMenuOpen = false;
    }
  }

  goToAccount(): void {
    this.closeUserMenu();
    this.setActivePanel(this.SIDE_PANEL_LIST['ACCOUNT']);
  }

  goToSwitchOrganization(): void {
    this.closeUserMenu();
    this.setActivePanel(this.SIDE_PANEL_LIST['SWITCH_ORG']);
  }

  logOut(): void {
    this.closeUserMenu();
    this.authService.logOutApplication();
  }
}
