import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { PARTICLE_ROUTES_LIST } from './constants/common-constant';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'majestic-warhorse';
  public activeRouteName: string = '';
  public PARTICLE_ROUTES_LIST: string[] = PARTICLE_ROUTES_LIST;
  constructor(private router: Router) {}
  ngOnInit() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.activeRouteName = event?.url?.split('/')?.[1]?.toUpperCase();
      }
    });
  }
}
