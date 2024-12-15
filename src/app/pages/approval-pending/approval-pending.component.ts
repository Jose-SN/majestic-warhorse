import { Component } from '@angular/core';
import { CommonSearchProfileComponent } from "../../components/common-search-profile/common-search-profile.component";

@Component({
  selector: 'app-approval-pending',
  standalone: true,
  imports: [CommonSearchProfileComponent],
  templateUrl: './approval-pending.component.html',
  styleUrl: './approval-pending.component.scss',
})
export class ApprovalPendingComponent {
  seachTextHandler(searchText:string){

  }
}
