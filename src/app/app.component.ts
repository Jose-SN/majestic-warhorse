import { Component, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { PARTICLE_ROUTES_LIST } from './constants/common-constant';
import { CommonService } from './shared/services/common.service';
import { Subject, takeUntil } from 'rxjs';
import { IModelInfo } from './components/common-dialog/model/popupmodel';
import { CommonDialogComponent } from './components/common-dialog/common-dialog.component';
import { COMPONENT_NAME } from './constants/popup-constants';
import { FileViwerComponent } from './components/file-viwer/file-viwer.component';
import { AssignTeachersComponent } from './components/assign-teachers/assign-teachers.component';

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
  @ViewChild(CommonDialogComponent) commonDialogComponent!: CommonDialogComponent;
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
        this.loadPopupComponent(modelInfo);
      });
    this.commonService
      .closePopupModelHandle()
      .pipe(takeUntil(this.destroy$))
      .subscribe((closeModel) => {
        this.closeModel();
      });
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
