import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentTeacherAssignListComponent } from './student-teacher-assign-list.component';

describe('StudentTeacherAssignListComponent', () => {
  let component: StudentTeacherAssignListComponent;
  let fixture: ComponentFixture<StudentTeacherAssignListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentTeacherAssignListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StudentTeacherAssignListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
