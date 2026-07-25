import { Component, inject, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { JugadorServices } from '../../services/jugador-services';
import { Jugador } from '../../model/Jugador';
import { Partida } from '../../model/Partida';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chess } from 'chess.js';
import { FichaServices } from '../../services/ficha-services';

@Component({
  selector: 'app-partida-vs-ia',
  standalone: true,
  imports: [
    MatIcon,
    MatButton,
    MatIconButton,
    MatCardContent,
    MatCardTitle,
    MatCard,
    MatCardHeader,
    DatePipe,
    MatCardSubtitle,
    FormsModule,
    NgClass,
  ],
  templateUrl: './partida-vs-ia.html',
  styleUrl: './partida-vs-ia.css',
})
export class PartidaVsIa implements OnInit, OnDestroy {
  route = inject(ActivatedRoute);
  router = inject(Router);
  jugadorService = inject(JugadorServices);
  cdr = inject(ChangeDetectorRef);
  fichaService: FichaServices = inject(FichaServices);

  idJugador!: number;
  jugador!: Jugador;
  iaJugador!: Jugador;
  partida!: Partida;

  showNiveles: boolean = false;
  showTiempos: boolean = false;

  showVictoryModal: boolean = false;
  victoryWinnerName: string = '';
  victoryReason: string = '';

  selectedElo: number = 500;

  flechasDibujadas: { id: string, pathData: string }[] = [];
  cuadroInicioFlecha: string | null = null;

  tiemposDisponibles: string[] = [
    '15 segundos', '30 segundos', '1 minuto', '1:30 minutos', '2 minutos',
    '2:30 minutos', '5 minutos', '10 minutos', '15 minutos', '20 minutos',
    '25 minutos', '30 minutos', '45 minutos', '60 minutos', '120 minutos', 'Infinito'
  ];
  selectedTimeIndex: number = 7;
  tiempoSeleccionado: string = '10 minutos';

  partidaEnCurso: boolean = false;
  turnoJugador: boolean = true;

  tiempoTotalSegundos: number = 0;
  tiempoJugadorSegundos: number = 0;
  tiempoIASegundos: number = 0;

  capturedByWhite: string[] = [];
  capturedByBlack: string[] = [];

  intervalTotal: any;
  intervalTurno: any;

  chess = new Chess('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1');

  boardSquares: any[] = [];
  pieces: { id: number, type: string, color: string, square: string }[] = [];

  selectedSquare: string | null = null;
  possibleMoves: string[] = [];
  captureMoves: string[] = [];
  incrementoSegundos: number = 3;

  historyFens: string[] = [];
  currentReviewIndex: number | null = null;

  private stockfishWorker: Worker | null = null;
  private engineReady: boolean = false;

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

  ngOnInit(): void {
    this.idJugador = Number(this.route.snapshot.params['id']);

    this.iaJugador = {
      nombreCompleto: 'Stockfish',
      apellidoCompleto: '(Oro)',
      correoElectronico: 'ia@chess.com',
      fechaNacimiento: new Date(),
      contrasena: '',
      elo: 500,
      nroVictorias: 0,
      nroDerrotas: 0,
      nroEmpates: 0,
      estado: 'Activo',
    };

    this.jugadorService.buscarJugadoresPorId(this.idJugador).subscribe((data) => {
      this.jugador = data;
      this.iniciarPartidaInfo();
      this.cdr.detectChanges();
    });

    this.initBoard();
    this.initStockfish();
  }

  initStockfish() {
    if (typeof Worker !== 'undefined') {
      this.stockfishWorker = new Worker('./assets/stockfish.js');
      this.stockfishWorker.onmessage = (event) => {
        this.handleEngineMessage(event.data);
      };
      const skill = this.mapEloToSkillLevel(this.selectedElo);

      this.sendToEngine('uci');
      this.sendToEngine(`setoption name Skill Level value ${skill}`);
      this.sendToEngine('isready');
      this.sendToEngine('ucinewgame');
    } else {
      console.error('Web Workers no son compatibles con este navegador.');
    }
  }

  sendToEngine(command: string) {
    if (this.stockfishWorker) {
      this.stockfishWorker.postMessage(command);
    }
  }

  handleEngineMessage(message: string) {
    if (message === 'readyok') {
      this.engineReady = true;
    }
    if (message.startsWith('bestmove')) {
      const bestMoveAlgebraic = message.split(' ')[1];
      this.executeAIMove(bestMoveAlgebraic);
    }
  }

  initBoard() {
    this.boardSquares = [];
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const id = String.fromCharCode(97 + j) + (8 - i);
        this.boardSquares.push({ id: id, light: (i + j) % 2 === 0 });
      }
    }
    this.syncVisualBoard(null);
  }

  syncVisualBoard(targetMoveIndex: number | null) {
    const tempChess = new Chess('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1');
    let newPieces: any[] = [];
    let pId = 0;
    const board = tempChess.board();
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const p = board[i][j];
        if (p) {
          newPieces.push({
            id: pId++,
            type: p.type,
            color: p.color,
            square: String.fromCharCode(97 + j) + (8 - i)
          });
        }
      }
    }

    const allMoves = this.chess.history({ verbose: true });
    const limit = targetMoveIndex !== null ? targetMoveIndex : allMoves.length - 1;

    this.capturedByWhite = [];
    this.capturedByBlack = [];

    for (let i = 0; i <= limit; i++) {
      const move = allMoves[i];

      if (move.captured) {
        if (move.color === 'w') {
          this.capturedByWhite.push(move.captured);
        } else {
          this.capturedByBlack.push(move.captured);
        }

        let captureSquare = move.to;
        if (move.flags.includes('e')) {
          const rank = parseInt(move.to[1]);
          const captureRank = move.color === 'w' ? rank - 1 : rank + 1;
          captureSquare = move.to[0] + captureRank;
        }
        newPieces = newPieces.filter(p => p.square !== captureSquare);
      }

      const movedPiece = newPieces.find(p => p.square === move.from);
      if (movedPiece) {
        movedPiece.square = move.to;
        if (move.promotion) movedPiece.type = move.promotion;
      }
    }

    this.sortCapturedPieces();
    this.pieces = newPieces;
  }

  reviewMove(index: number) {
    if (index < 0 || index >= this.historyFens.length) return;

    this.selectedSquare = null;
    this.possibleMoves = [];
    this.captureMoves = [];

    if (index === this.historyFens.length - 1) {
      this.currentReviewIndex = null;
      this.syncVisualBoard(null);
    } else {
      this.currentReviewIndex = index;
      this.syncVisualBoard(index);
    }

    this.cdr.detectChanges();
  }

  isActiveMove(index: number): boolean {
    if (this.currentReviewIndex !== null) {
      return this.currentReviewIndex === index;
    }
    return index === this.historyFens.length - 1;
  }

  onSquareClick(squareId: string) {
    if (!this.partidaEnCurso) return;
    if (this.currentReviewIndex !== null) return;
    this.borrarFlechas();
    const piece = this.chess.get(squareId as any);
    if (!this.selectedSquare) {
      return;
    }
    if (this.chess.turn()) return;

    if (this.selectedSquare && this.possibleMoves.includes(squareId)) {
      this.executeMove(this.selectedSquare, squareId);
    } else {
      if (piece && piece.color === this.chess.turn()) {
        this.selectedSquare = squareId;
        const moves = this.chess.moves({ square: squareId as any, verbose: true });
        this.possibleMoves = moves.map((m) => m.to);
        this.captureMoves = moves
          .filter((m) => m.flags.includes('c') || m.flags.includes('e'))
          .map((m) => m.to);
      } else {
        this.selectedSquare = null;
        this.possibleMoves = [];
        this.captureMoves = [];
      }
    }
    this.cdr.detectChanges();
  }

  prevenirMenuContextual(event: MouseEvent) {
    event.preventDefault();
  }

  executeMove(from: string, to: string) {
    try {
      const move = this.chess.move({ from, to, promotion: 'q' });
      if (move) {
        this.updateVisualBoard(move);

        this.historyFens.push(this.chess.fen());

        this.selectedSquare = null;
        this.possibleMoves = [];
        this.captureMoves = [];

        if (this.tiempoSeleccionado !== 'Infinito') {
          this.tiempoJugadorSegundos += this.incrementoSegundos;
        }

        this.turnoJugador = this.chess.turn() === 'w';

        if (this.checkGameOver(move)) {
          this.cdr.detectChanges();
          return;
        }

        if (this.partidaEnCurso && this.chess.turn() === 'b') {
          setTimeout(() => this.askEngineForMove(), 250);
        }

        this.cdr.detectChanges();
      }
    } catch (e) {
      console.error('Movimiento ilegal', e);
    }
  }

  askEngineForMove() {
    if (!this.engineReady || !this.stockfishWorker || !this.partidaEnCurso) return;
    this.sendToEngine(`position fen ${this.chess.fen()}`);
    const skillLevel = this.mapEloToSkillLevel(this.selectedElo);
    this.sendToEngine(`setoption name Skill Level value ${skillLevel}`);
    this.sendToEngine('go movetime 1000');
  }

  executeAIMove(bestMoveAlgebraic: string) {
    const from = bestMoveAlgebraic.slice(0, 2);
    const to = bestMoveAlgebraic.slice(2, 4);
    const promotion = bestMoveAlgebraic.length > 4 ? bestMoveAlgebraic[4] : 'q';

    try {
      const move = this.chess.move({ from, to, promotion });
      if (move) {
        this.updateVisualBoard(move);

        this.historyFens.push(this.chess.fen());

        if (this.tiempoSeleccionado !== 'Infinito') {
          this.tiempoIASegundos += this.incrementoSegundos;
        }
        this.turnoJugador = this.chess.turn() === 'w';
        this.checkGameOver(move);
        this.cdr.detectChanges();
      }
    } catch (e) {
      console.error('Engine propuso movimiento ilegal', e);
    }
  }

  updateVisualBoard(move: any) {
    if (move.captured) {
      if (move.color === 'w') {
        this.capturedByWhite.push(move.captured);
      } else {
        this.capturedByBlack.push(move.captured);
      }
      this.sortCapturedPieces();

      let captureSquare = move.to;
      if (move.flags.includes('e')) {
        const rank = parseInt(move.to[1]);
        const captureRank = move.color === 'w' ? rank - 1 : rank + 1;
        captureSquare = move.to[0] + captureRank;
      }
      this.pieces = this.pieces.filter(p => p.square !== captureSquare);
    }

    const movedPiece = this.pieces.find(p => p.square === move.from);
    if (movedPiece) {
      movedPiece.square = move.to;
      if (move.promotion) movedPiece.type = move.promotion;
    }
  }

  mapEloToSkillLevel(elo: number): number {
    if (elo == 0){
      this.selectedElo = 1;
    }
    if (elo <= 200) return 0;
    if (elo >= 1600) return 20;
    return Math.floor(elo / 80);
  }

  checkGameOver(move: any): boolean {
    if (this.chess.isCheckmate()) {
      this.limpiarIntervalos();
      this.partidaEnCurso = false;
      this.partida.estado = 'Finalizada (Jaque Mate)';
      this.victoryWinnerName = move.color === 'w' ? `${this.jugador.nombreCompleto}` : this.iaJugador.nombreCompleto;
      this.victoryReason = '¡Jaque Mate!';
      this.showVictoryModal = true;
      return true;
    } else if (this.chess.isDraw() || this.chess.isStalemate()) {
      this.limpiarIntervalos();
      this.partidaEnCurso = false;
      this.partida.estado = 'Tablas';
      return true;
    }
    return false;
  }

  getPieceUnicodeDirect(type: string, color: string): string {
    const pieces: any = {
      w: { p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚' },
      b: { p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚' },
    };
    return pieces[color][type];
  }

  getColIndex(sq: string): number { return sq.charCodeAt(0) - 97; }
  getRowIndex(sq: string): number { return 8 - parseInt(sq[1]); }

  ngOnDestroy(): void {
    this.limpiarIntervalos();
    if (this.stockfishWorker) {
      this.stockfishWorker.terminate();
    }
  }

  resetGame(): void {
    this.chess = new Chess('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1');
    this.initBoard();
    this.selectedSquare = null;
    this.possibleMoves = [];
    this.captureMoves = [];
    this.turnoJugador = true;
    this.tiempoTotalSegundos = 0;
    this.tiempoJugadorSegundos = 0;
    this.tiempoIASegundos = 0;
    this.limpiarIntervalos();

    this.historyFens = [];
    this.currentReviewIndex = null;

    this.sendToEngine('ucinewgame');

    this.capturedByWhite = [];
    this.capturedByBlack = [];

    this.sendToEngine('ucinewgame');
    this.cdr.detectChanges();
  }

  iniciarPartidaInfo(): void {
    this.partida = {
      nroPartida: Math.floor(Math.random() * 10000),
      nombreContrincante: `${this.iaJugador.nombreCompleto} ${this.iaJugador.apellidoCompleto} - ELO: ${this.iaJugador.elo}`,
      fecha: new Date(),
      duracion: { hours: 0, minutes: 0 } as any,
      nombreGanador: 'Pendiente',
      eloGanadoOPerdido: 0,
      jugador: this.jugador,
      fichas: null as any,
      fichasEliminadas: 0,
      estado: 'En espera',
    };
  }

  ajustarNivel(): void {
    this.selectedElo = this.iaJugador.elo;
    this.showNiveles = true;
    this.cdr.detectChanges();
  }

  confirmarNivel(): void {
    const rank = this.currentRank;
    this.iaJugador.apellidoCompleto = `(${rank.name})`;
    this.iaJugador.elo = this.selectedElo;
    this.partida.nombreContrincante = `${this.iaJugador.nombreCompleto} ${this.iaJugador.apellidoCompleto} - ELO: ${this.iaJugador.elo}`;
    this.showNiveles = false;
    this.cdr.detectChanges();
  }

  ajustarTiempo(): void {
    const index = this.tiemposDisponibles.indexOf(this.tiempoSeleccionado);
    this.selectedTimeIndex = index !== -1 ? index : 7;
    this.showTiempos = true;
    this.cdr.detectChanges();
  }

  confirmarTiempo(): void {
    this.tiempoSeleccionado = this.tiemposDisponibles[this.selectedTimeIndex];
    this.showTiempos = false;
    this.cdr.detectChanges();
  }

  jugar(): void {
    if (!this.partidaEnCurso) {
      this.resetGame();
      this.partidaEnCurso = true;
      this.partida.estado = 'En Curso';
      this.tiempoTotalSegundos = 0;
      this.turnoJugador = true;

      const limiteSegundos = this.parsearTiempoASegundos(this.tiempoSeleccionado);
      this.tiempoJugadorSegundos = limiteSegundos;
      this.tiempoIASegundos = limiteSegundos;

      this.intervalTotal = window.setInterval(() => {
        this.tiempoTotalSegundos++;
        this.cdr.detectChanges();
      }, 1000);

      this.intervalTurno = window.setInterval(() => {
        if (limiteSegundos !== -1) {
          if (this.turnoJugador && this.tiempoJugadorSegundos > 0) {
            this.tiempoJugadorSegundos--;
          } else if (!this.turnoJugador && this.tiempoIASegundos > 0) {
            this.tiempoIASegundos--;
          }

          if (this.tiempoJugadorSegundos <= 0) {
            this.limpiarIntervalos();
            this.partidaEnCurso = false;
            this.victoryWinnerName = this.iaJugador.nombreCompleto;
            this.victoryReason = 'Tiempo agotado';
            this.partida.estado = 'Finalizada (Tiempo IA)';
            this.showVictoryModal = true;
            this.cdr.detectChanges();
            return;
          }

          if (this.tiempoIASegundos <= 0) {
            this.limpiarIntervalos();
            this.partidaEnCurso = false;
            this.victoryWinnerName = `${this.jugador.nombreCompleto}`;
            this.victoryReason = 'Tiempo agotado';
            this.partida.estado = 'Finalizada (Tiempo Jugador)';
            this.showVictoryModal = true;
            this.cdr.detectChanges();
            return;
          }
        }
        this.cdr.detectChanges();
      }, 1000);

    } else {
      this.partidaEnCurso = false;
      this.partida.estado = 'En espera';
      this.limpiarIntervalos();
      this.resetGame();
    }
    this.cdr.detectChanges();
  }

  cambiarTurno(): void {
    if (this.partidaEnCurso) {
      this.turnoJugador = !this.turnoJugador;
      this.cdr.detectChanges();
    }
  }

  limpiarIntervalos(): void {
    if (this.intervalTotal) clearInterval(this.intervalTotal);
    if (this.intervalTurno) clearInterval(this.intervalTurno);
  }

  parsearTiempoASegundos(tiempoString: string): number {
    if (tiempoString === 'Infinito') return -1;
    if (tiempoString.includes('segundos')) {
      return parseInt(tiempoString.split(' ')[0]);
    }
    if (tiempoString.includes('minuto')) {
      const valor = tiempoString.split(' ')[0];
      if (valor.includes(':')) {
        const partes = valor.split(':');
        return parseInt(partes[0]) * 60 + parseInt(partes[1]);
      } else {
        return parseInt(valor) * 60;
      }
    }
    return 0;
  }

  formatoCountdown(segundos: number): string {
    if (segundos === -1) return '∞';
    const m = Math.floor(segundos / 60);
    const s = segundos % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  formatoGlobal(segundos: number): string {
    const m = Math.floor(segundos / 60);
    const s = segundos % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }

  salir(): void {
    this.router.navigate(['/menu-principal', this.idJugador]);
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

  get moveHistoryPairs() {
    const history = this.chess.history();
    const pairs = [];
    for (let i = 0; i < history.length; i += 2) {
      pairs.push({
        turn: Math.floor(i / 2) + 1,
        white: history[i],
        whiteIndex: i,
        black: history[i + 1] || '',
        blackIndex: i + 1 < history.length ? i + 1 : null
      });
    }
    return pairs;
  }
  sortCapturedPieces() {
    const pieceValues: any = { 'q': 9, 'r': 5, 'b': 3, 'n': 3, 'p': 1 };
    this.capturedByWhite.sort((a, b) => pieceValues[b] - pieceValues[a]);
    this.capturedByBlack.sort((a, b) => pieceValues[b] - pieceValues[a]);
  }

  iniciarFlecha(event: MouseEvent, squareId: string) {
    if (event.button === 2) {
      this.cuadroInicioFlecha = squareId;
    }
  }

  terminarFlecha(event: MouseEvent, squareId: string) {
    if (event.button === 2 && this.cuadroInicioFlecha) {
      if (this.cuadroInicioFlecha !== squareId) {
        const colInicio = this.getColIndex(this.cuadroInicioFlecha);
        const filaInicio = this.getRowIndex(this.cuadroInicioFlecha);
        const colFin = this.getColIndex(squareId);
        const filaFin = this.getRowIndex(squareId);
        const x1 = (colInicio * 12.5) + 6.25;
        const y1 = (filaInicio * 12.5) + 6.25;
        const x2 = (colFin * 12.5) + 6.25;
        const y2 = (filaFin * 12.5) + 6.25;
        const dx = Math.abs(colFin - colInicio);
        const dy = Math.abs(filaFin - filaInicio);
        let pathData = '';
        if ((dx === 1 && dy === 2) || (dx === 2 && dy === 1)) {
          let elbowCol, elbowRow;
          if (dy === 2) {
            elbowCol = colInicio;
            elbowRow = filaFin;
          } else {
            elbowCol = colFin;
            elbowRow = filaInicio;
          }
          const elbowX = (elbowCol * 12.5) + 6.25;
          const elbowY = (elbowRow * 12.5) + 6.25;
          pathData = `M ${x1} ${y1} L ${elbowX} ${elbowY} L ${x2} ${y2}`;
        } else {
          pathData = `M ${x1} ${y1} L ${x2} ${y2}`;
        }
        const idFlecha = `${this.cuadroInicioFlecha}-${squareId}`;
        const indexExistente = this.flechasDibujadas.findIndex(f => f.id === idFlecha);
        if (indexExistente !== -1) {
          this.flechasDibujadas.splice(indexExistente, 1);
        } else {
          this.flechasDibujadas.push({ id: idFlecha, pathData: pathData });
        }
        this.cdr.detectChanges();
      }
      this.cuadroInicioFlecha = null;
    }
  }

  borrarFlechas() {
    this.flechasDibujadas = [];
  }
}
