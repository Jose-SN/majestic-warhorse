import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { ParticleComponent } from 'src/app/particle/particle.component';
import { LoginService } from './login.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ParticleComponent, FormsModule, ReactiveFormsModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent implements OnInit {
  public loginForm!: FormGroup;
  constructor(
    private formBuilder: FormBuilder,
    private loginService: LoginService,
    private router: Router
  ) {}
  ngOnInit(): void {
    this.loginService.getAllUsers();
    this.loginForm = this.formBuilder.group({
      email: ['', Validators.required],
      password: ['', Validators.required],
    });
  }
  onSubmit(): void {
    this.loginForm.markAllAsTouched();
    if (this.loginForm.valid) {
      this.loginService.userLogin(this.loginForm.value);
    }
  }
  gotoPage(pageName: string) {
    this.router.navigate([`/${pageName}`]);
  }
}
