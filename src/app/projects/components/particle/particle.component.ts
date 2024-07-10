import { Component } from '@angular/core';
import { MoveDirection, ClickMode, HoverMode, OutMode, Container } from "tsparticles-engine";
@Component({
  selector: 'app-particle',
  standalone: true,
  imports: [],
  templateUrl: './particle.component.html',
  styleUrl: './particle.component.scss'
})
export class ParticleComponent {
  id = "tsparticles";
  particlesOptions = {
    background: {
        color: {
            value: "#0d47a1",
        },
    },
    fpsLimit: 120,
    interactivity: {
        events: {
            onClick: {
                enable: true,
                mode: ClickMode.push,
            },
            onHover: {
                enable: true,
                mode: HoverMode.repulse,
            },
            resize: true,
        },
        modes: {
            push: {
                quantity: 4,
            },
            repulse: {
                distance: 200,
                duration: 0.4,
            },
        },
    },
    particles: {
        color: {
            value: "#ffffff",
        },
        links: {
            color: "#ffffff",
            distance: 150,
            enable: true,
            opacity: 0.5,
            width: 1,
        },
        move: {
            direction: MoveDirection.none,
            enable: true,
            outModes: {
                default: OutMode.bounce,
            },
            random: false,
            speed: 6,
            straight: false,
        },
        number: {
            density: {
                enable: true,
                area: 800,
            },
            value: 80,
        },
        opacity: {
            value: 0.5,
        },
        shape: {
            type: "polygon",
        },
        size: {
            value: { min: 1, max: 5 },
        },
    },
    detectRetina: true,
};
particlesLoaded(container: Container): void {
  console.log(container);
}
}
