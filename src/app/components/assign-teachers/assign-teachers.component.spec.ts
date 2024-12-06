import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignTeachersComponent } from './assign-teachers.component';

describe('AssignTeachersComponent', () => {
  let component: AssignTeachersComponent;
  let fixture: ComponentFixture<AssignTeachersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignTeachersComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AssignTeachersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
