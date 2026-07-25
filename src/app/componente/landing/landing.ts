import { AfterViewInit, ChangeDetectorRef, Component, inject } from '@angular/core';
import { MatButton, MatFabButton } from '@angular/material/button';
import { MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-landing',
  imports: [
    MatButton,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatCardSubtitle,
    MatCardActions,
    RouterLink,
    MatFabButton,
    NgClass,
  ],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing implements AfterViewInit {
  currentSlideIndex: number = 0;
  slideInterval: any;
  carouselImages = [
    '/assets/imagen%201.PNG',
    '/assets/Captura%202.PNG',
    '/assets/Captura%203.PNG',
    '/assets/Captura%204.PNG',
    '/assets/Captura%205.PNG',
  ];
  cdr = inject(ChangeDetectorRef);
  constructor() {}
  ngAfterViewInit(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          } else {
            entry.target.classList.remove('visible');
          }
        });
      },
      {
        threshold: 0.15,
      },
    );

    const hiddenElements = document.querySelectorAll('.scroll-reveal');
    hiddenElements.forEach((el) => observer.observe(el));
  }
  scrollTo(seccionId: string): void {
    const elemento = document.getElementById(seccionId);

    if (elemento) {
      elemento.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }
  ngOnInit(): void {
    this.iniciarCarruselAutomatico();
  }
  ngOnDestroy(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }
  iniciarCarruselAutomatico() {
    this.slideInterval = setInterval(() => {
      this.nextSlide();
    }, 3500);
  }

  nextSlide() {
    this.currentSlideIndex = (this.currentSlideIndex + 1) % this.carouselImages.length;
  }

  prevSlide() {
    this.currentSlideIndex =
      (this.currentSlideIndex - 1 + this.carouselImages.length) % this.carouselImages.length;
  }

  pausarCarrusel() {
    if (this.slideInterval) clearInterval(this.slideInterval);
  }

  reanudarCarrusel() {
    this.iniciarCarruselAutomatico();
  }

  getSlideClass(index: number): string {
    const total = this.carouselImages.length;
    let relativeIndex = (index - this.currentSlideIndex) % total;
    if (relativeIndex < 0) {
      relativeIndex += total;
    }
    return `stack-pos-${relativeIndex}`;
  }
}
