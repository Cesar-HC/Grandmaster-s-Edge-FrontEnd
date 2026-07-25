import { Component, inject } from '@angular/core';
import { MatToolbar, MatToolbarRow } from '@angular/material/toolbar';
import { MatButton } from '@angular/material/button';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-nav-bar',
  imports: [MatToolbar, MatToolbarRow, MatButton, RouterLinkActive, RouterLink],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.css',
})
export class NavBar {
  protected readonly scrollTo = scrollTo;
  private router: Router = inject(Router);
  isLoggedIn(): boolean {
    return localStorage.getItem('token') !== null;
  }
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('id');
    this.router.navigate(['/']);
  }
  goHome(): void {
    if (this.isLoggedIn()) {
      const userId = localStorage.getItem('id') || '';
      if (userId) {
        this.router.navigate(['/menu-principal', userId]);
      } else {
        this.router.navigate(['/menu-principal']);
      }
    } else {
      this.router.navigate(['/']);
    }
  }
}
