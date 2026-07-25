import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Fichas } from '../model/Fichas';

@Injectable({
  providedIn: 'root',
})
export class FichaServices {
  private url = environment.apiUrl;
  private httpclient: HttpClient = inject(HttpClient);
  constructor(){}
  crearFicha(fichas: Fichas){
    return this.httpclient.post(this.url + '/ficha', fichas);
  }
  actualizarFicha(fichas: Fichas){
    return this.httpclient.put(this.url + '/ficha', fichas);
  }
  eliminarFicha(id: number){
    return this.httpclient.delete(this.url + '/ficha/' + id);
  }
  buscarFichas(){
    return this.httpclient.get<Fichas[]>(this.url + '/fichas');
  }
  buscarFichasPorId(id: number){
    return this.httpclient.get<Fichas>(this.url + '/ficha/id/' + id);
  }
}
