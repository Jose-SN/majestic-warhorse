import { Component } from '@angular/core';
import { ParticleComponent } from '../../components/particle/particle.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ParticleComponent],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {

}
