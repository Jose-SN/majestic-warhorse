import { Component, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { CommonService } from 'src/app/shared/services/common.service';
import { CommonSliderComponent } from 'src/app/components/common-slider/common-slider.component';
import { DashboardService } from '../dashboard/dashboard.service';
import { CommonSearchProfileComponent } from 'src/app/components/common-search-profile/common-search-profile.component';
import { UserModel } from '../login-page/model/user-model';

@Component({
  selector: 'app-teachers-list',
  standalone: true,
  imports: [CommonSearchProfileComponent],
  templateUrl: './teachers-list.component.html',
  styleUrl: './teachers-list.component.scss',
})
export class TeachersListComponent {
  public profileUrl: string = '';
  public mobMenu: boolean = false;
  public showSliderView: boolean = false;
  public teachersList: UserModel[] = [];
  @ViewChild('btnTrigger', { static: true }) btnTrigger!: ElementRef<HTMLButtonElement>;
  constructor(
    private authService: AuthService,
    private commonService: CommonService,
    private dashboardService: DashboardService
  ) {
    this.profileUrl = this.commonService.loginedUserInfo.profileImage ?? '';
    this.teachersList = this.commonService.allUsersList.filter((users) => users.role === 'teacher');
  }
  triggerMenu() {
    this.btnTrigger.nativeElement.click();
    this.mobMenu = false;
  }
  mobileMenu() {
    this.mobMenu = !this.mobMenu;
  }

  logOut() {
    this.authService.logOutApplication();
  }
  sliderActiveRemove(): void {
    this.showSliderView = false;
  }
}
