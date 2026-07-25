import { Component, inject } from '@angular/core';
import { MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { Router, RouterLink } from '@angular/router';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatError, MatFormField, MatInput, MatLabel, MatSuffix } from '@angular/material/input';
import { JugadorServices } from '../../services/jugador-services';
import { LoginService } from '../../services/login-service';
import { ResponseDto } from '../../model/response-dto';
import { RequestDto } from '../../model/request-dto';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  imports: [
    MatCardActions,
    RouterLink,
    MatButton,
    MatFormField,
    MatLabel,
    MatCardContent,
    MatCardTitle,
    MatCardSubtitle,
    MatCardHeader,
    MatCard,
    MatInput,
    ReactiveFormsModule,
    MatError,
    MatIcon,
    MatIconButton,
    MatSuffix,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    contrasena: new FormControl('', Validators.required),
  });
  email: string = '';
  contrasena: string = '';
  hidePassword = true;
  jugadorService: JugadorServices = inject(JugadorServices);
  router: Router = inject(Router);
  loginService: LoginService = inject(LoginService);
  constructor() {}
  ngOnInit() {
    if (localStorage.getItem('token') != null) {
      localStorage.clear();
      console.log('Token y items eliminados');
    }
    localStorage.removeItem('token');
  }
  onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }
    const email = this.loginForm.value.email!;
    const contrasena = this.loginForm.value.contrasena!;
    const requestDto = new RequestDto();
    requestDto.username = this.loginForm.value.email!;
    requestDto.password = this.loginForm.value.contrasena!;
    this.loginService.login(requestDto).subscribe({
      next: (data: ResponseDto) => {
        console.log('Respuesta login:', data);
        localStorage.setItem('token', data.jwt);
        if (data.roles && data.roles.length > 0) {
          const rol = data.roles[0];
          localStorage.setItem('rol', rol);
        }
        this.jugadorService.buscarJugadoresPorCorreo(email).subscribe((jugador) => {
          localStorage.setItem('id', jugador.id!.toString());
          this.router.navigate(['/menu-principal', jugador.id]);
        });
      },
      error: (err) => {
        console.error(err);
        alert('Credenciales incorrectas');
        this.loginForm.reset();
      },
    });
  }
}
