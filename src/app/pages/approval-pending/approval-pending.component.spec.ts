import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApprovalPendingComponent } from './approval-pending.component';

describe('ApprovalPendingComponent', () => {
  let component: ApprovalPendingComponent;
  let fixture: ComponentFixture<ApprovalPendingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApprovalPendingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ApprovalPendingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
