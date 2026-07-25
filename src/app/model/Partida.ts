import { Time } from '@angular/common';
import { Jugador } from './Jugador';
import { Fichas } from './Fichas';

export class Partida {
  id?: number;
  nroPartida: number;
  nombreContrincante: string;
  fecha: Date;
  duracion: Time;
  nombreGanador: string;
  eloGanadoOPerdido: number;
  jugador: Jugador;
  fichas: Fichas;
  fichasEliminadas: number;
  estado: string;
}
