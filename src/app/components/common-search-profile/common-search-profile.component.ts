import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from 'src/app/services/api-service/auth.service';
import { CommonService } from 'src/app/shared/services/common.service';
@Component({
  selector: 'app-search-profile',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './common-search-profile.component.html',
  styleUrl: './common-search-profile.component.scss',
})
export class CommonSearchProfileComponent {
  public mobMenu: boolean = false;
  public profileUrl: string = '';
  public searchText: string = '';
  @Output() mobNavchild = new EventEmitter<void>();
  constructor(
    private authService: AuthService,
    private commonService: CommonService
  ) {
    this.profileUrl = this.commonService.loginedUserInfo.profileImage ?? '';
  }
  logOut() {
    this.authService.logOutApplication();
  }

  btnMob() {
    this.mobNavchild.emit();
  }
  setInputSearch() {
    this.commonService.setCommonSearchText(this.searchText);
  }
}
