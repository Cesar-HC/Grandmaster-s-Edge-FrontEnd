import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot
} from '@angular/router';
import {catchError, map, Observable, of} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private http: HttpClient) {}
  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Acceso denegado");
      window.history.back();
      return of(false);
    }
    const payload = JSON.parse(atob(token.split('.')[1]));
    const correoToken = payload.sub;
    let role: string | null = null;
    if (route.params['role']) {
      const r = route.params['role'].toUpperCase();
      if (r.includes("PROVEEDOR")) role = "PROVEEDOR";
      if (r.includes("ANFITRION")) role = "ANFITRION";
    }
    if (!role) {
      if (route.params['idProveedor'] !== undefined) role = 'PROVEEDOR';
      if (route.params['idAnfitrion'] !== undefined) role = 'ANFITRION';
    }
    const idRuta =
      route.params['idProveedor'] !== undefined ? Number(route.params['idProveedor']) :
        route.params['idAnfitrion'] !== undefined ? Number(route.params['idAnfitrion']) :
          route.params['id'] !== undefined ? Number(route.params['id']) :
            null;
    if (!role || idRuta === null) return of(true);
    let urlBackend = '';
    if (role === 'PROVEEDOR') {
      urlBackend = `${environment.apiUrl}/proveedor/correo/${correoToken}`;
    } else if (role === 'ANFITRION') {
      urlBackend = `${environment.apiUrl}/anfitrion/correo/${correoToken}`;
    } else {
      return of(true);
    }
    return this.http.get<any>(urlBackend).pipe(
      map(data => {
        const idBackend = data.id;
        if (idBackend !== idRuta) {
          alert("Acceso denegado");
          window.history.back();
          return false;
        }
        return true;
      }),
      catchError(() => {
        alert("Acceso denegado");
        window.history.back();
        return of(false);
      })
    );
  }
}
