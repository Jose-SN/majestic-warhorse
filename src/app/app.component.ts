import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { PARTICLE_ROUTES_LIST } from './constants/common-constant';
import { CommonService } from './shared/services/common.service';
import { Subject, takeUntil } from 'rxjs';
import { IModelInfo } from './components/common-dialog/model/popupmodel';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'majestic-warhorse';
  public activeRouteName: string = '';
  public isDialogOpen: boolean = false;
  private destroy$ = new Subject<void>();
  public popupModelInfo: IModelInfo = {} as IModelInfo;
  public PARTICLE_ROUTES_LIST: string[] = PARTICLE_ROUTES_LIST;
  constructor(
    private router: Router,
    private commonService: CommonService
  ) {}
  ngOnInit() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.activeRouteName = event?.url?.split('/')?.[1]?.toUpperCase();
      }
    });
    this.commonService
      .getOpenpopupModelHandle()
      .pipe(takeUntil(this.destroy$))
      .subscribe((modelInfo: IModelInfo) => {
        this.popupModelInfo = modelInfo;
        this.isDialogOpen = true;
      });
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  closeModel(){
    this.isDialogOpen = !this.isDialogOpen;
    this.popupModelInfo = {} as IModelInfo;
  }
}
