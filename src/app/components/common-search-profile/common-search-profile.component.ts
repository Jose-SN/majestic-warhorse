import { Component, EventEmitter, Output } from '@angular/core';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { CommonService } from 'src/app/shared/services/common.service';
@Component({
  selector: 'app-search-profile',
  standalone: true,
  imports: [],
  templateUrl: './common-search-profile.component.html',
  styleUrl: './common-search-profile.component.scss'
})
export class CommonSearchProfileComponent {
  public isMobileNav = false;
  public profileUrl: string = '';
  @Output() mobNavchild = new EventEmitter<void>();
  constructor(
    private authService: AuthService,
    private commonService: CommonService,
  ) 
  {
    this.profileUrl = this.commonService.loginedUserInfo.profileImage ?? '';
  }
  logOut() {
    this.authService.logOutApplication();
  }
  
  btnMob() {
    this.mobNavchild.emit();
    this.isMobileNav = !this.isMobileNav;
  }
}
