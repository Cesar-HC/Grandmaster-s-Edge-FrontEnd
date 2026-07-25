import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Jugador } from '../model/Jugador';

@Injectable({
  providedIn: 'root',
})
export class JugadorServices {
  private url = environment.apiUrl;
  private httpclient: HttpClient = inject(HttpClient);
  constructor(){}
  crearJugador(jugador: Jugador){
    return this.httpclient.post(this.url + '/jugador', jugador);
  }
  actualizarJugador(jugador: Jugador){
    return this.httpclient.put(this.url + '/jugador', jugador);
  }
  eliminarJugador(id: number){
    return this.httpclient.delete(this.url + '/jugador/' + id);
  }
  buscarJugadores(){
    return this.httpclient.get<Jugador[]>(this.url + '/jugadores');
  }
  buscarJugadoresPorId(id: number){
    return this.httpclient.get<Jugador>(this.url + '/jugador/id/' + id);
  }
  buscarJugadoresPorCorreo(correo: string){
    return this.httpclient.get<Jugador>(this.url + '/jugador/correo/' + correo);
  }
}
