import {inject, Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {RequestDto} from '../model/request-dto';
import {map, Observable} from 'rxjs';
import {Router} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private url = environment.apiUrl;
  private httpClient: HttpClient = inject(HttpClient);
  private router: Router = inject(Router);
  constructor(){}
  login(requestDto: RequestDto): Observable<any> {
    console.log("Enviando:", requestDto)
    return this.httpClient.post(this.url + "/authenticate", requestDto,
    ).pipe(map((body: any) => {
        console.log("Body:", body)
        const token = body.jwt;
        console.log("JWT desde body:", token)
        localStorage.setItem('token', token);
        return body;
      }
    ));
  }
  logout(){
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}
