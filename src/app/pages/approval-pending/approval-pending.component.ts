import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonSearchProfileComponent } from "../../components/common-search-profile/common-search-profile.component";

@Component({
  selector: 'app-approval-pending',
  standalone: true,
  imports: [CommonSearchProfileComponent],
  templateUrl: './approval-pending.component.html',
  styleUrl: './approval-pending.component.scss',
})
export class ApprovalPendingComponent implements OnInit {
  @Input() infoMessage: string = '';


  constructor(private router: Router) {}

  ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.infoMessage = navigation.extras.state['infoMessage'] || '';
    } else {
      // Fallback: check history state
      const state = history.state;
      if (state && state['infoMessage']) {
        this.infoMessage = state['infoMessage'];
      }
    }
  }
}
