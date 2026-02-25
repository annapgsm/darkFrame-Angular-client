import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserRegistrationForm } from './user-registration-form';

describe('UserRegistrationForm', () => {
  let component: UserRegistrationForm;
  let fixture: ComponentFixture<UserRegistrationForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserRegistrationForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserRegistrationForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
