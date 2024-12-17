import { Component, EventEmitter, Input, Output } from '@angular/core';
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
  public searchText: string = '';
  public profileUrl: string = '';
  @Input() pageName: string = '';
  @Output() seachTextHandler: EventEmitter<string> = new EventEmitter<string>();
  constructor(
    private authService: AuthService,
    private commonService: CommonService
  ) {
    this.profileUrl = this.commonService.decodeUrl(this.commonService.loginedUserInfo.profileImage ?? '');
  }
  logOut() {
    this.authService.logOutApplication();
  }
}
