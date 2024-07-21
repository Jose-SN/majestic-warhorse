import { Component } from '@angular/core';
import { PARTICLES_JSON } from 'src/app/particles/particles-json';

PARTICLES_JSON

declare var particlesJS: any;
@Component({
  selector: 'app-particle',
  standalone: true,
  imports: [],
  templateUrl: './particle.component.html',
  styleUrl: './particle.component.scss'
})
export class ParticleComponent {
    ngAfterViewInit() {
        particlesJS('particles-js', PARTICLES_JSON);
      }
}
