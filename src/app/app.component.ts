import { Component } from '@angular/core';
import { PARTICLES_JSON } from './particles/particles-json';

declare var particlesJS: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'majestic-warhorse';
  ngAfterViewInit() {
    particlesJS('particles-js', PARTICLES_JSON);
  }
}
