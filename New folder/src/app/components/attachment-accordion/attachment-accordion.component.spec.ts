import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttachmentAccordionComponent } from './attachment-accordion.component';

describe('AttachmentAccordionComponent', () => {
  let component: AttachmentAccordionComponent;
  let fixture: ComponentFixture<AttachmentAccordionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttachmentAccordionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AttachmentAccordionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
