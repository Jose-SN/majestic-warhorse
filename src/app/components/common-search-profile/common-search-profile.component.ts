import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserModel } from 'src/app/pages/login-page/model/user-model';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { CommonService } from 'src/app/shared/services/common.service';
@Component({
  selector: 'app-search-profile',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './common-search-profile.component.html',
  styleUrl: './common-search-profile.component.scss'
})
export class CommonSearchProfileComponent {
  public isMobileNav = false;
  public profileUrl: string = '';
  public searchText: string = '';
  @Output() mobNavchild = new EventEmitter<void>();
  public mobMenu: boolean = false;
  public loginedUserInfo: UserModel = {} as UserModel;
  constructor(
    private authService: AuthService,
    private commonService: CommonService
  ) {
    this.loginedUserInfo = this.commonService.loginedUserInfo;
    this.profileUrl = (this.commonService.loginedUserInfo.profileImage || this.commonService.loginedUserInfo.profile_image) ?? '';
  }
  logOut() {
    this.authService.logOutApplication();
  }
  
  btnMob() {
    this.mobNavchild.emit();
    this.isMobileNav = !this.isMobileNav;
  }
  setInputSearch() {
    this.commonService.setCommonSearchText(this.searchText);
  }
}
