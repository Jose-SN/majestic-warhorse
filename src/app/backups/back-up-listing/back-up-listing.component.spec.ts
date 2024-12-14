import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackUpListingComponent } from './back-up-listing.component';

describe('BackUpListingComponent', () => {
  let component: BackUpListingComponent;
  let fixture: ComponentFixture<BackUpListingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackUpListingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BackUpListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
