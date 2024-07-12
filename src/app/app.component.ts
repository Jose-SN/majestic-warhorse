import { Component } from '@angular/core';
import { MoveDirection, ClickMode, HoverMode, OutMode, Container, Engine } from "tsparticles-engine";import { PARTICLES_JSON } from './particles/particles-json';

declare var particlesJS: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'majestic-warhorse';
//   ngAfterViewInit() {
//     particlesJS('particles-js', PARTICLES_JSON);
//   }
//   id = "tsparticles";
//   particlesOptions = {
//     background: {
//         color: {
//             value: "#0d47a1",
//         },
//     },
//     fpsLimit: 120,
//     interactivity: {
//         events: {
//             onClick: {
//                 enable: true,
//                 mode: ClickMode.push,
//             },
//             onHover: {
//                 enable: true,
//                 mode: HoverMode.repulse,
//             },
//             resize: true,
//         },
//         modes: {
//             push: {
//                 quantity: 4,
//             },
//             repulse: {
//                 distance: 200,
//                 duration: 0.4,
//             },
//         },
//     },
//     particles: {
//         color: {
//             value: "#ffffff",
//         },
//         links: {
//             color: "#ffffff",
//             distance: 150,
//             enable: true,
//             opacity: 0.5,
//             width: 1,
//         },
//         move: {
//             direction: MoveDirection.none,
//             enable: true,
//             outModes: {
//                 default: OutMode.bounce,
//             },
//             random: false,
//             speed: 6,
//             straight: false,
//         },
//         number: {
//             density: {
//                 enable: true,
//                 area: 800,
//             },
//             value: 80,
//         },
//         opacity: {
//             value: 0.5,
//         },
//         shape: {
//             type: "circle",
//         },
//         size: {
//             value: { min: 1, max: 5 },
//         },
//     },
//     detectRetina: true,
// };

// particlesLoaded(container: Container): void {
//     console.log(container);
// }

}

