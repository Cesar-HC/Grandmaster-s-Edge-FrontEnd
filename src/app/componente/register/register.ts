import { Component, inject } from '@angular/core';
import { MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { Router, RouterLink } from '@angular/router';
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
} from '@angular/material/datepicker';
import { MatButton} from '@angular/material/button';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { JugadorServices } from '../../services/jugador-services';
import { formatDate } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-register',
  imports: [
    MatCard,
    MatCardActions,
    RouterLink,
    MatLabel,
    MatFormField,
    MatInput,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatDatepicker,
    MatCardContent,
    MatCardSubtitle,
    MatCardHeader,
    MatCardTitle,
    MatButton,
    MatNativeDateModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private router: Router = inject(Router);
  private jugadorService: JugadorServices = inject(JugadorServices);
  hidePassword = true;

  registerForm = new FormGroup({
    nombres: new FormControl('', Validators.required),
    apellidos: new FormControl('', Validators.required),
    fechaNacimiento: new FormControl('', Validators.required),
    correo: new FormControl('', [Validators.required, Validators.email]),
    contrasena: new FormControl('', Validators.required)
  });

  onSubmit() {
    if (this.registerForm.invalid) {
      return;
    }

    const rawDate = this.registerForm.value.fechaNacimiento;
    const formattedDate = rawDate ? formatDate(rawDate, 'yyyy-MM-dd', 'en-US') : '';

    const nuevoJugador = {
      nombreCompleto: this.registerForm.value.nombres || '',
      apellidoCompleto: this.registerForm.value.apellidos || '',
      correoElectronico: this.registerForm.value.correo || '',
      contrasena: this.registerForm.value.contrasena || '',
      fechaNacimiento: (formattedDate || '') as any,
      elo: 0,
      nroVictorias: 0,
      nroEmpates: 0,
      nroDerrotas: 0,
      estado: 'N/A'
    };
    const emailAComprobar = this.registerForm.value.correo || '';
    this.jugadorService.buscarJugadoresPorCorreo(emailAComprobar).subscribe({
      next: (jugadorExistente) => {
        if (jugadorExistente && jugadorExistente.id) {
          this.registerForm.get('correo')?.setErrors({ emailTomado: true });
        } else {
          this.procesarRegistro(nuevoJugador);
        }
      },
      error: (err) => {
        this.procesarRegistro(nuevoJugador);
      }
    });
  }

  procesarRegistro(nuevoJugador: any) {
    console.log('Enviando datos al backend:', nuevoJugador);

    this.jugadorService.crearJugador(nuevoJugador).subscribe({
      next: (response) => {
        console.log('Registro exitoso', response);
        alert('¡Cuenta creada con éxito! Ahora inicia sesión.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Error al registrar', err);
        alert('Hubo un error al crear la cuenta. Inténtalo de nuevo.');
      }
    });
  }
}
