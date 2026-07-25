import { Routes } from '@angular/router';
import { Landing } from './componente/landing/landing';
import { Login } from './componente/login/login';
import { Register } from './componente/register/register';
import MenuPrincipal from './componente/menu-principal/menu-principal';
import { AuthGuard } from './guards/auth-guard';
import { PartidaVsIa } from './componente/partida-vs-ia/partida-vs-ia';
import { PartidaVsJugador } from './componente/partida-vs-jugador/partida-vs-jugador';

export const routes: Routes = [
  {path: '', component: Landing},
  {path: 'login', component: Login},
  {path: 'register', component: Register},
  {path: 'menu-principal/:id', canActivate: [AuthGuard], component: MenuPrincipal},
  {path: 'partida-vs-ia/:id', canActivate: [AuthGuard], component: PartidaVsIa},
  {path: 'partida-vs-jugador/:id', canActivate: [AuthGuard], component: PartidaVsJugador},
];
