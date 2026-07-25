import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Partida } from '../model/Partida';

@Injectable({
  providedIn: 'root',
})
export class PartidaServices {
  private url = environment.apiUrl;
  private httpclient: HttpClient = inject(HttpClient);
  constructor(){}
  crearPartida(partida: Partida){
    return this.httpclient.post(this.url + '/partida', partida);
  }
  actualizarPartida(partida: Partida){
    return this.httpclient.put(this.url + '/partida', partida);
  }
  eliminarPartida(id: number){
    return this.httpclient.delete(this.url + '/partida/' + id);
  }
  buscarPartidas(){
    return this.httpclient.get<Partida[]>(this.url + '/partidas');
  }
  buscarPartidasPorId(id: number){
    return this.httpclient.get<Partida>(this.url + '/partida/id/' + id);
  }
}
