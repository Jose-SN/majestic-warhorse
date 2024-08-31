import { Component, AfterViewInit } from '@angular/core';
import { PARTICLES_JSON } from 'src/app/particles/particles-json';

PARTICLES_JSON

declare let particlesJS: any;
@Component({
  selector: 'app-particle',
  standalone: true,
  imports: [],
  templateUrl: './particle.component.html',
  styleUrl: './particle.component.scss'
})
export class ParticleComponent implements AfterViewInit {
    ngAfterViewInit() {
        particlesJS('particles-js', PARTICLES_JSON);
      }
}
