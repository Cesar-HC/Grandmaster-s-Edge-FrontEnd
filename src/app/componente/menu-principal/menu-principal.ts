import { ChangeDetectorRef, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { JugadorServices } from '../../services/jugador-services';
import { Jugador } from '../../model/Jugador';
import { Client } from '@stomp/stompjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-menu-principal',
  standalone: true,
  imports: [
    MatCard,
    MatCardHeader,
    MatIcon,
    MatCardTitle,
    MatCardSubtitle,
    MatCardContent,
    MatButton,
    MatIconButton,
    RouterLink,
    FormsModule
  ],
  templateUrl: './menu-principal.html',
  styleUrl: './menu-principal.css',
})
class MenuPrincipal implements OnInit, OnDestroy {
  private stompClient: Client;
  showRanks: boolean = false;
  jugadorService: JugadorServices = inject(JugadorServices);
  router: Router = inject(Router);
  cdr = inject(ChangeDetectorRef);
  idJugador!: number;
  jugador!: Jugador;
  selectedElo!: number;
  route = inject(ActivatedRoute);

  isSearching: boolean = false;
  searchTimeSeconds: number = 0;
  searchInterval: any;
  simulatedWebSocketTimeout: any;

  showMatchFoundModal: boolean = false;
  matchAcceptProgress: number = 100;
  matchAcceptInterval: any;

  showCreateRoomModal: boolean = false;
  isRoomPrivate: boolean = false;
  roomPassword: string = '';
  roomMaxPlayers: number | null = 2;

  showJoinRoomModal: boolean = false;
  showPasswordPromptModal: boolean = false;
  searchQuery: string = '';
  enteredPassword: string = '';
  selectedRoomToJoin: any = null;
  isWebSocketConnected: boolean = false;

  availableRooms: any[];

  ngOnInit(): void {
    this.idJugador = Number(this.route.snapshot.params['id']);
    this.jugadorService.buscarJugadoresPorId(this.idJugador).subscribe(data => {
      this.jugador = data;
      this.selectedElo = Number(data.elo);
      this.cdr.detectChanges();
    });
    this.iniciarConexionWebSocket();
  }

  iniciarConexionWebSocket() {
    const token = localStorage.getItem('token');
    this.stompClient = new Client({
      brokerURL: 'wss://grandmaster-s-edge.onrender.com/ws-chess',
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      onConnect: () => {
        console.log('Conectado al servidor de Matchmaking');
        this.isWebSocketConnected = true;

        this.stompClient.subscribe(`/queue/match/${this.idJugador}`, (mensaje) => {
          const datos = JSON.parse(mensaje.body);

          if (datos.tipo === 'MATCH_FOUND') {
            console.log('Oponente encontrado con ELO:', datos.rivalElo);
            this.onMatchFound();
          }

          else if (datos.tipo === 'MATCH_START') {
            console.log('¡Ambos aceptaron! Entrando a la sala:', datos.salaId);
            this.showMatchFoundModal = false;

            this.router.navigate(['/partida-vs-jugador', datos.salaId], {
              queryParams: {
                rival: datos.rivalId,
                yo: this.idJugador
              }
            });
          }
          else if (datos.tipo === 'MATCH_CANCELLED') {
            console.log('El oponente canceló el enfrentamiento.');
            this.showMatchFoundModal = false;
            clearInterval(this.matchAcceptInterval);
            this.cancelSearch();
            alert('El oponente no aceptó el enfrentamiento.');
          }

          else if (datos.tipo === 'LISTA_SALAS') {
            this.availableRooms = datos.salas.map((s: any) => ({
              codigo: s.codigoSala,
              nombre: s.nombreSala,
              actuales: s.jugadoresActuales,
              maximos: s.maxJugadores,
              privada: s.esPrivada,
              enCurso: s.enCurso
            }));
            this.cdr.detectChanges();
          }

          else if (datos.tipo === 'UNIDO_EXITO') {
            this.router.navigate(['/partida-vs-jugador', datos.salaId], {
              queryParams: {
                yo: this.idJugador,
                rival: datos.rivalId
              }
            });
          }
        });
      },
      onStompError: (frame) => {
        console.error('Error STOMP:', frame.headers['message']);
      }
    });

    this.stompClient.activate();
  }
  ngOnDestroy(): void {
    if (this.searchInterval) clearInterval(this.searchInterval);
    if (this.matchAcceptInterval) clearInterval(this.matchAcceptInterval);

    if (this.stompClient) {
      this.stompClient.deactivate();
    }
  }

  toggleSearch(): void {
    if (this.isSearching) {
      this.cancelSearch();
    } else {
      this.startSearch();
    }
  }

  startSearch(): void {
    this.isSearching = true;
    this.searchTimeSeconds = 0;

    this.searchInterval = window.setInterval(() => {
      this.searchTimeSeconds++;
      this.cdr.detectChanges();
    }, 1000);

    this.stompClient.publish({
      destination: '/app/buscarPartida',
      body: JSON.stringify({ idJugador: this.idJugador, elo: this.selectedElo })
    });
  }

  cancelSearch(): void {
    this.isSearching = false;
    if (this.searchInterval) clearInterval(this.searchInterval);
    this.searchTimeSeconds = 0;

    this.stompClient.publish({
      destination: '/app/cancelarBusqueda',
      body: JSON.stringify({ idJugador: this.idJugador })
    });

    this.cdr.detectChanges();
  }

  onMatchFound(): void {
    this.isSearching = false;
    if (this.searchInterval) clearInterval(this.searchInterval);

    this.showMatchFoundModal = true;
    this.matchAcceptProgress = 100;

    this.matchAcceptInterval = window.setInterval(() => {
      this.matchAcceptProgress -= 1;

      if (this.matchAcceptProgress <= 0) {
        this.declineMatch();
      }
      this.cdr.detectChanges();
    }, 100);
  }

  acceptMatch(): void {
    clearInterval(this.matchAcceptInterval);
    const btnText = document.querySelector('.wave-yellow-text');
    if (btnText) btnText.innerHTML = 'Esperando al rival...';
    this.stompClient.publish({
      destination: '/app/aceptarEnfrentamiento',
      body: JSON.stringify({ idJugador: this.idJugador })
    });
  }

  declineMatch(): void {
    clearInterval(this.matchAcceptInterval);
    this.showMatchFoundModal = false;
    this.cancelSearch();
    this.stompClient.publish({
      destination: '/app/rechazarEnfrentamiento',
      body: JSON.stringify({ idJugador: this.idJugador })
    });
  }

  formatSearchTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }

  get currentRank() {
    if (this.selectedElo < 200) return { name: 'Hierro', icon: 'filter_tilt_shift', color: '#555555' };
    if (this.selectedElo < 400) return { name: 'Plata', icon: 'brightness_5', color: '#cccccc' };
    if (this.selectedElo < 600) return { name: 'Oro', icon: 'stars', color: '#ffd700' };
    if (this.selectedElo < 800) return { name: 'Platino', icon: 'verified', color: '#00bcd4' };
    if (this.selectedElo < 1000) return { name: 'Esmeralda', icon: 'diamond', color: '#50c878' };
    if (this.selectedElo < 1200) return { name: 'Diamante', icon: 'radio_button_checked', color: '#005b96' };
    if (this.selectedElo < 1400) return { name: 'Maestro', icon: 'psychology', color: '#ff9800' };
    if (this.selectedElo < 1600) return { name: 'G. Maestro', icon: 'military_tech', color: '#ffea00' };
    return { name: 'Tops Glob.', icon: 'emoji_events', color: '#ffffff' };
  }

  getRankName(elo: number): string {
    if (elo < 200) return 'Hierro';
    if (elo < 400) return 'Plata';
    if (elo < 600) return 'Oro';
    if (elo < 800) return 'Platino';
    if (elo < 1000) return 'Esmeralda';
    if (elo < 1200) return 'Diamante';
    if (elo < 1400) return 'Maestro';
    if (elo < 1600) return 'G. Maestro';
    return 'Tops Glob.';
  }

  getRankColor(elo: number): string {
    if (elo < 200) return '#555555';
    if (elo < 400) return '#cccccc';
    if (elo < 600) return '#ffd700';
    if (elo < 800) return '#00bcd4';
    if (elo < 1000) return '#50c878';
    if (elo < 1200) return '#005b96';
    if (elo < 1400) return '#ff9800';
    if (elo < 1600) return '#ffea00';
    return '#ffffff';
  }

  createRoom(): void {
    const codigoSala = Math.random().toString(36).substring(2, 8);

    this.stompClient.publish({
      destination: '/app/crearSala',
      body: JSON.stringify({
        codigoSala: codigoSala,
        nombreSala: `Sala de ${this.jugador.nombreCompleto} ${this.jugador.apellidoCompleto}`,
        esPrivada: this.isRoomPrivate,
        contrasena: this.isRoomPrivate ? this.roomPassword : '',
        maxJugadores: this.roomMaxPlayers || 2,
        creadorId: this.idJugador,
        elo: this.jugador.elo
      })
    });

    this.showCreateRoomModal = false;
    this.router.navigate(['/partida-vs-jugador', codigoSala], {
      queryParams: { yo: this.idJugador }
    });
  }

  get filteredRooms() {
    if (!this.searchQuery) return this.availableRooms;
    const q = this.searchQuery.toLowerCase();
    return this.availableRooms.filter(r =>
      r.nombre.toLowerCase().includes(q) || r.codigo.toLowerCase().includes(q)
    );
  }

  openJoinModal() {
    this.showJoinRoomModal = true;
    this.searchQuery = '';
    this.availableRooms = [];

    this.stompClient.publish({
      destination: '/app/solicitarSalas',
      body: JSON.stringify({ jugadorId: this.idJugador })
    });
  }

  selectRoom(room: any) {
    if (room.enCurso) {
      alert('La partida ya se encuentra en curso.');
      return;
    }
    if (room.actuales >= room.maximos) {
      alert('La sala ya está llena.');
      return;
    }

    if (room.privada) {
      this.selectedRoomToJoin = room;
      this.showPasswordPromptModal = true;
      this.enteredPassword = '';
    } else {
      this.joinRoom(room.codigo);
    }
  }

  joinRoom(codigo: string) {
    this.showJoinRoomModal = false;
    this.showPasswordPromptModal = false;

    this.stompClient.publish({
      destination: '/app/unirseSala',
      body: JSON.stringify({
        codigoSala: codigo,
        jugadorId: this.idJugador,
        nombre: `${this.jugador.nombreCompleto} ${this.jugador.apellidoCompleto}`,
        elo: this.jugador.elo
      })
    });
  }

  confirmJoinPrivate() {
    if (this.enteredPassword.trim().length > 0) {
      this.joinRoom(this.selectedRoomToJoin.codigo);
    } else {
      alert('Debes ingresar la contraseña de la sala.');
    }
  }
}

export default MenuPrincipal
