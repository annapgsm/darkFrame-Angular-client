import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserLoginForm } from './user-login-form';

describe('UserLoginForm', () => {
  let component: UserLoginForm;
  let fixture: ComponentFixture<UserLoginForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserLoginForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserLoginForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
