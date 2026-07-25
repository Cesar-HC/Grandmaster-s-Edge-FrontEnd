export class Jugador {
  id?: number;
  nombreCompleto: string;
  apellidoCompleto: string;
  correoElectronico: string;
  fechaNacimiento: Date;
  contrasena: string;
  elo: number;
  nroVictorias: number;
  nroDerrotas: number;
  nroEmpates: number;
  estado: string;
  role?:{
    id: number;
    name: string;
  };
}
