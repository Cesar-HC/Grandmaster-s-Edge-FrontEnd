import { Component, inject, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { JugadorServices } from '../../services/jugador-services';
import { Jugador } from '../../model/Jugador';
import { Partida } from '../../model/Partida';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatFabButton, MatIconButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { DatePipe, NgClass, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chess } from 'chess.js';
import { Client } from '@stomp/stompjs';

@Component({
  selector: 'app-partida-vs-jugador',
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
    SlicePipe,
    MatFabButton,
  ],
  templateUrl: './partida-vs-jugador.html',
  styleUrl: './partida-vs-jugador.css',
})
export class PartidaVsJugador implements OnInit, OnDestroy {
  gameSessionId: number = 0;

  route = inject(ActivatedRoute);
  router = inject(Router);
  jugadorService = inject(JugadorServices);
  cdr = inject(ChangeDetectorRef);
  private stompClient!: Client;
  ruletaRotation: number = 0;

  salaId!: string;
  jugador!: Jugador;
  rival!: Jugador;
  partida!: Partida;

  colorAsignado: 'w' | 'b' | null = null;
  esperandoRival: boolean = false;
  partidaEnCurso: boolean = false;
  turnoJugador: boolean = true;

  showTiempos: boolean = false;
  showVictoryModal: boolean = false;
  victoryWinnerName: string = '';
  victoryReason: string = '';

  showTiempoPropuestoModal: boolean = false;
  tiempoPropuesto: string = '';
  emisorIdPropuesta!: number;

  showInicioPropuestoModal: boolean = false;

  showRuletaModal: boolean = false;
  ruletaSpinning: boolean = false;
  ruletaCurrentName: string = '';
  ruletaWinnerMessage: string = '';

  esSalaPrivada: boolean = false;
  jugadoresEnSala: any[] = [];
  soyLider: boolean = false;
  soyEspectador: boolean = false;

  yaSeVoto: boolean = false;
  showVotingModal: boolean = false;
  tiempoVotacion: number = 20;
  votoEmitido: boolean = false;
  votacionActiva: boolean = false;

  turnoActualTablero: 'w' | 'b' = 'w';

  tiemposDisponibles: string[] = [
    '15 segundos',
    '30 segundos',
    '1 minuto',
    '1:30 minutos',
    '2 minutos',
    '2:30 minutos',
    '5 minutos',
    '10 minutos',
    '15 minutos',
    '20 minutos',
    '25 minutos',
    '30 minutos',
    '45 minutos',
    '60 minutos',
    '120 minutos',
    'Infinito',
  ];
  selectedTimeIndex: number = 7;
  tiempoSeleccionado: string = '10 minutos';

  tiempoTotalSegundos: number = 0;
  tiempoJugadorSegundos: number = 0;
  tiempoRivalSegundos: number = 0;
  eloDeltaMessage: string | null = null;
  eloDeltaColor: string = '';
  intervalTotal: any;
  intervalTurno: any;
  chess = new Chess();
  boardSquares: any[] = [];
  pieces: { id: number; type: string; color: string; square: string }[] = [];
  selectedSquare: string | null = null;
  possibleMoves: string[] = [];
  captureMoves: string[] = [];
  incrementoSegundos: number = 3;
  historyFens: string[] = [];
  capturedByWhite: string[] = [];
  capturedByBlack: string[] = [];
  currentReviewIndex: number | null = null;
  emotesFavoritos: any[] = [];
  emotesDisponibles: any[] = [
    { icon: '😀', name: 'feliz sonrisa' }, { icon: '😃', name: 'feliz sonrisa abierta' }, { icon: '😄', name: 'sonrisa risa ojos cerrados' },
    { icon: '😁', name: 'sonrisa grande dientes' }, { icon: '😆', name: 'risa fuerte carcajada' }, { icon: '😅', name: 'risa nerviosa gota sudor' },
    { icon: '😂', name: 'risa llorando lagrimas' }, { icon: '🤣', name: 'muerto de risa piso carcajada' },
    { icon: '😊', name: 'feliz tierno rubor' }, { icon: '😇', name: 'angel aureola bueno' }, { icon: '🙂', name: 'sonrisa ligera neutral' },
    { icon: '🙃', name: 'cabeza al reves sarcasmo ironia' }, { icon: '😉', name: 'guiño ojo coqueto' }, { icon: '😌', name: 'alivio paz tranquilo' },
    { icon: '😍', name: 'enamorado corazones amor' }, { icon: '🥰', name: 'amor corazones tierno' }, { icon: '😘', name: 'beso corazon' },
    { icon: '😗', name: 'beso simple' }, { icon: '😙', name: 'beso ojos cerrados' }, { icon: '😚', name: 'beso tierno rubor' },
    { icon: '😋', name: 'saborear comida lengua deliciosa' }, { icon: '😛', name: 'lengua afuera burla loca' }, { icon: '😜', name: 'lengua guiño loco broma' },
    { icon: '🤪', name: 'loco desquiciado absurdo' }, { icon: '😝', name: 'lengua ojos cerrados broma' }, { icon: '🤑', name: 'dinero billetes lengua rico' },
    { icon: '🤗', name: 'abrazo manos tierno' }, { icon: '🤭', name: 'risa tapada oops secreto' }, { icon: '🤫', name: 'silencio callar shh' },
    { icon: '🤔', name: 'pensativo duda' }, { icon: '🤐', name: 'cierre boca secreto mudo' }, { icon: '🤨', name: 'ceja levantada sospecha duda' },
    { icon: '😐', name: 'neutral sin expresion' }, { icon: '😑', name: 'ojos cerrados molestia aburrido' }, { icon: '😶', name: 'sin boca silencio' },
    { icon: '😏', name: 'mirada coqueta astuto' }, { icon: '😒', name: 'mirada fastidio molestia' }, { icon: '🙄', name: 'rodar ojos fastidio harto' },
    { icon: '😬', name: 'dientes apretados nervios uy' }, { icon: '🤥', name: 'mentiroso pinocho nariz' }, { icon: '😌', name: 'alivio' },
    { icon: '😔', name: 'tristeza mirada abajo deprimido' }, { icon: '😪', name: 'sueño gota cansado' }, { icon: '🤤', name: 'babeando antojo deseo' },
    { icon: '😴', name: 'durmiendo zzz roncar' }, { icon: '😷', name: 'mascarilla enfermo covid' }, { icon: '🤒', name: 'termometro fiebre enfermo' },
    { icon: '🤕', name: 'vendaje herida golpe' }, { icon: '🤢', name: 'asco mareo verde vomito' }, { icon: '🤮', name: 'vomitando asco asqueroso' },
    { icon: '🤧', name: 'estornudo salud alergia' }, { icon: '🥵', name: 'calor sudando quemando ardiente' }, { icon: '🥶', name: 'congelado frio hielo' },
    { icon: '🥴', name: 'mareado ebrio loco' }, { icon: '😵', name: 'espirales mareado desmayo' }, { icon: '🤯', name: 'cabeza explotando mente wow' },
    { icon: '🤠', name: 'vaquero sombrero' }, { icon: '🥳', name: 'fiesta celebracion cumpleaños' }, { icon: '😎', name: 'cool lentes sol facha' },
    { icon: '🤓', name: 'nerd lentes estudioso' }, { icon: '🧐', name: 'monoculo inspeccion elegante' }, { icon: '😕', name: 'confundido duda' },
    { icon: '😟', name: 'preocupacion tristeza' }, { icon: '🙁', name: 'tristeza ligera' }, { icon: '☹️', name: 'fruncir ceño triste deprimido' },
    { icon: '😮', name: 'sorpresa boca abierta wow' }, { icon: '😯', name: 'asombro ligero oh' }, { icon: '😲', name: 'sorpresa extrema shock' },
    { icon: '😳', name: 'sonrojado pena verguenza' }, { icon: '🥺', name: 'ojos tiernos por favor perrito' }, { icon: '😦', name: 'susto boca abierta' },
    { icon: '😧', name: 'angustia dolor' }, { icon: '😨', name: 'miedo susto terror' }, { icon: '😰', name: 'miedo sudor ansiedad' },
    { icon: '😥', name: 'triste gota sudor alivio' }, { icon: '😢', name: 'lagrima tristeza llorar' }, { icon: '😭', name: 'llorando lagrimas llanto triste' },
    { icon: '😱', name: 'grito asustado terror panico' }, { icon: '😖', name: 'dolor intenso sufrimiento' }, { icon: '😣', name: 'sufrimiento aguantar' },
    { icon: '😞', name: 'decepcion triste' }, { icon: '😓', name: 'gota sudor frio verguenza' }, { icon: '😩', name: 'agotamiento lamento cansado' },
    { icon: '😫', name: 'cansancio queja fatiga' }, { icon: '🥱', name: 'bostezo aburrido sueño' }, { icon: '😤', name: 'humo nariz orgullo enojo frustracion' },
    { icon: '😡', name: 'enojado rojo furia' }, { icon: '😠', name: 'molesto gruñon' }, { icon: '🤬', name: 'insultando groserias enojo' },
    { icon: '😈', name: 'diablo sonrisa morado malvado' }, { icon: '👿', name: 'diablo enojado morado' }, { icon: '💀', name: 'calavera muerto muerte risa' },
    { icon: '☠️', name: 'calavera huesos veneno pirata' }, { icon: '💩', name: 'caca popo broma' }, { icon: '🤡', name: 'payaso broma ridiculo' },
    { icon: '👹', name: 'ogro monstruo rojo feo' }, { icon: '👺', name: 'duende mascara roja' }, { icon: '👻', name: 'fantasma susto buu' },
    { icon: '👽', name: 'alien extraterrestre ovni' }, { icon: '👾', name: 'alienigena pixel juego' }, { icon: '🤖', name: 'robot maquina' },
    { icon: '😺', name: 'gato feliz' }, { icon: '😸', name: 'gato risa' }, { icon: '😹', name: 'gato risa llorando lagrimas' },
    { icon: '😻', name: 'gato enamorado corazon' }, { icon: '😼', name: 'gato sonrisa lado astuto' }, { icon: '😽', name: 'gato beso' },
    { icon: '🙀', name: 'gato asustado grito' }, { icon: '😿', name: 'gato triste lagrima llorando' }, { icon: '😾', name: 'gato enojado molesto' },
    { icon: '👐', name: 'manos abiertas' }, { icon: '🤲', name: 'manos juntas pedir' }, { icon: '🙌', name: 'manos arriba celebrar alabanza' },
    { icon: '👏', name: 'aplausos bravo' }, { icon: '🤝', name: 'apreton manos trato saludo pacto' }, { icon: '👍', name: 'bien like pulgar arriba ok' },
    { icon: '👎', name: 'mal dislike pulgar abajo no' }, { icon: '👊', name: 'puño golpe chocar' }, { icon: '✊', name: 'puño alzado fuerza resistencia' },
    { icon: '🤛', name: 'puño izquierdo' }, { icon: '🤜', name: 'puño derecho' }, { icon: '🤞', name: 'dedos cruzados suerte ojala' },
    { icon: '✌️', name: 'paz victoria dos' }, { icon: '🤟', name: 'te amo señas rock' }, { icon: '🤘', name: 'rock cuernos metal' },
    { icon: '👌', name: 'ok perfecto excelente' }, { icon: '🤏', name: 'poco pequeño pellizco' },
    { icon: '👈', name: 'apuntar izquierda' }, { icon: '👉', name: 'apuntar derecha' }, { icon: '👆', name: 'apuntar arriba' },
    { icon: '👇', name: 'apuntar abajo' }, { icon: '☝️', name: 'un dedo atencion' }, { icon: '✋', name: 'detener mano alto 5' },
    { icon: '🖐️', name: 'mano cinco dedos hola' }, { icon: '🤚', name: 'dorso mano' }, { icon: '🖖', name: 'saludo vulcano spock viaje estrellas' },
    { icon: '👋', name: 'saludar hola adios' }, { icon: '🤙', name: 'llamame shaka surf genial' }, { icon: '💪', name: 'musculo fuerza gym' },
    { icon: '🖕', name: 'dedo medio insulto groseria' }, { icon: '✍️', name: 'escribiendo lapiz firma' }, { icon: '🙏', name: 'gracias rezar por favor oracion' },
    { icon: '💅', name: 'pintar uñas divo diva fabuloso' }, { icon: '🤳', name: 'selfie celular foto' },
    { icon: '❤️', name: 'corazon rojo amor pasion' }, { icon: '🧡', name: 'corazon naranja' }, { icon: '💛', name: 'corazon amarillo amistad' },
    { icon: '💚', name: 'corazon verde esperanza' }, { icon: '💙', name: 'corazon azul' }, { icon: '💜', name: 'corazon morado' },
    { icon: '🖤', name: 'corazon negro' }, { icon: '🤍', name: 'corazon blanco paz' }, { icon: '🤎', name: 'corazon cafe' },
    { icon: '💔', name: 'corazon roto desamor' },
    { icon: '❣️', name: 'corazon exclamacion' }, { icon: '💕', name: 'dos corazones amor' }, { icon: '💞', name: 'corazones girando' },
    { icon: '💓', name: 'corazon latiendo vibrando' }, { icon: '💗', name: 'corazon creciendo' }, { icon: '💖', name: 'corazon brillos magico' },
    { icon: '💘', name: 'corazon flechado cupido' }, { icon: '💝', name: 'corazon regalo' }, { icon: '💌', name: 'carta amor sobre' },
    { icon: '💋', name: 'beso labios rojo' }, { icon: '💯', name: 'cien perfecto calificacion' }, { icon: '💢', name: 'vena enojo molestia furia' },
    { icon: '💥', name: 'explosion boom' }, { icon: '💫', name: 'estrellas mareo golpe' }, { icon: '💦', name: 'gotas agua sudor' },
    { icon: '💨', name: 'viento correr huir rapido' }, { icon: '✨', name: 'estrellas magicas brillos wow' }, { icon: '🔥', name: 'fuego ardiente caliente on fire' },
    { icon: '🐶', name: 'perro perrito mascota' }, { icon: '🐱', name: 'gato gatito mascota' }, { icon: '🐭', name: 'raton' },
    { icon: '🐹', name: 'hamster' }, { icon: '🐰', name: 'conejo pascua' }, { icon: '🦊', name: 'zorro astuto' },
    { icon: '🐻', name: 'oso tierno' }, { icon: '🐼', name: 'panda' }, { icon: '🐨', name: 'koala' },
    { icon: '🐯', name: 'tigre' }, { icon: '🦁', name: 'leon rey' }, { icon: '🐮', name: 'vaca' },
    { icon: '🐷', name: 'cerdo puerco' }, { icon: '🐸', name: 'rana sapo' }, { icon: '🐵', name: 'mono chango' },
    { icon: '🐔', name: 'gallina pollo' }, { icon: '🐧', name: 'pinguino' }, { icon: '🐦', name: 'pajaro ave' },
    { icon: '🦆', name: 'pato' }, { icon: '🦅', name: 'aguila' }, { icon: '🦉', name: 'buho sabiduria' },
    { icon: '🦇', name: 'murcielago batman vampiro' }, { icon: '🐺', name: 'lobo auu' }, { icon: '🐴', name: 'caballo' },
    { icon: '🦄', name: 'unicornio magia' }, { icon: '🐝', name: 'abeja' }, { icon: '🐛', name: 'oruga insecto' },
    { icon: '🦋', name: 'mariposa' }, { icon: '🐌', name: 'caracol lento' }, { icon: '🐢', name: 'tortuga lenta' },
    { icon: '🐍', name: 'serpiente vibora' }, { icon: '🦖', name: 'dinosaurio rex' }, { icon: '🐙', name: 'pulpo kraken' },
    { icon: '🦑', name: 'calamar juego' }, { icon: '🦐', name: 'camaron' }, { icon: '🦀', name: 'cangrejo' },
    { icon: '🐠', name: 'pez tropical' }, { icon: '🐟', name: 'pez pescado' }, { icon: '🐬', name: 'delfin' },
    { icon: '🐳', name: 'ballena' }, { icon: '🦈', name: 'tiburon' }, { icon: '🐊', name: 'cocodrilo' },
    { icon: '🍎', name: 'manzana roja fruta' }, { icon: '🍌', name: 'platano banana' }, { icon: '🍇', name: 'uvas vino' },
    { icon: '🍓', name: 'fresa fruta' }, { icon: '🍉', name: 'sandia verano' }, { icon: '🥑', name: 'aguacate palta' },
    { icon: '🥕', name: 'zanahoria conejo' }, { icon: '🥦', name: 'brocoli verdura sano' }, { icon: '🍄', name: 'hongo champiñon mario' },
    { icon: '🍞', name: 'pan' }, { icon: '🥐', name: 'croissant pan dulce' }, { icon: '🥖', name: 'baguette pan frances' },
    { icon: '🧀', name: 'queso raton' }, { icon: '🥚', name: 'huevo' }, { icon: '🍳', name: 'huevo frito sarten desayuno' },
    { icon: '🥞', name: 'hotcakes panqueques' }, { icon: '🥓', name: 'tocino panceta bacon' }, { icon: '🥩', name: 'carne asado' },
    { icon: '🍗', name: 'pollo pierna frito' }, { icon: '🌭', name: 'hotdog perro caliente' }, { icon: '🍔', name: 'hamburguesa comida rapida' },
    { icon: '🍟', name: 'papas fritas comida rapida' }, { icon: '🍕', name: 'pizza italiana' }, { icon: '🌮', name: 'taco mexico' },
    { icon: '🌯', name: 'burrito wrap' }, { icon: '🥗', name: 'ensalada sano dieta' }, { icon: '🍝', name: 'pasta espagueti italia' },
    { icon: '🍜', name: 'fideos ramen sopa asiatica' }, { icon: '🍣', name: 'sushi japon pescado' }, { icon: '🥟', name: 'empanada dumpling bao' },
    { icon: '🍦', name: 'helado cono vainilla' }, { icon: '🍧', name: 'helado raspado' }, { icon: '🍩', name: 'dona rosquilla dulce' },
    { icon: '🍪', name: 'galleta chispas chocolate' }, { icon: '🎂', name: 'pastel cumpleaños torta' }, { icon: '🍰', name: 'rebanada pastel dulce' },
    { icon: '🧁', name: 'cupcake quequito muffin' }, { icon: '🍫', name: 'chocolate barra' }, { icon: '🍬', name: 'dulce caramelo' },
    { icon: '🍭', name: 'paleta dulce' }, { icon: '☕', name: 'cafe taza caliente despertar' }, { icon: '🍵', name: 'te matcha verde caliente' },
    { icon: '🥤', name: 'vaso refresco soda pajita' }, { icon: '🧃', name: 'jugo cajita zumo' }, { icon: '🥛', name: 'leche vaso blanco' },
    { icon: '🍺', name: 'cerveza vaso alcohol' }, { icon: '🍻', name: 'cervezas brindis salud' }, { icon: '🍷', name: 'vino copa tinto' },
    { icon: '🥂', name: 'brindis copas champagne salud' }, { icon: '🥃', name: 'whisky vaso ron licor' }, { icon: '🍹', name: 'coctel tropical trago playa' },
    { icon: '🧊', name: 'hielo cubo frio' },
    { icon: '🏆', name: 'trofeo copa ganador victoria' }, { icon: '🥇', name: 'medalla oro primer lugar' }, { icon: '🎮', name: 'mando consola videojuego jugar' },
    { icon: '🎲', name: 'dado suerte juego azar' }, { icon: '🎯', name: 'diana objetivo blanco tiro' }, { icon: '🎸', name: 'guitarra musica rock' },
    { icon: '🎧', name: 'audifonos auriculares musica' }, { icon: '📱', name: 'celular telefono movil' }, { icon: '💻', name: 'laptop computadora pc' },
    { icon: '💡', name: 'foco idea luz brillante' }, { icon: '💣', name: 'bomba explosion boom' }, { icon: '💊', name: 'pastilla medicina cura' },
    { icon: '💉', name: 'jeringa vacuna sangre' }, { icon: '⚔️', name: 'espadas cruzadas batalla lucha' }, { icon: '🛡️', name: 'escudo defensa proteccion' },
    { icon: '⏳', name: 'reloj arena tiempo espera' }, { icon: '🚀', name: 'cohete espacio volar to the moon' }, { icon: '🛸', name: 'ovni platillo volador alien' },
    { icon: '👑', name: 'corona rey reina lider' }, { icon: '💎', name: 'diamante joya rico caro' }
  ];
  searchTerm: string = '';
  mostrarMenuEmotes: boolean = false;
  emotesActivos: any[] = [];

  mostrarChat: boolean = false;
  nuevoMensaje: string = '';
  chatMessages: { id: string; nombre: string; texto: string; esMio: boolean; audioData?: string; imageData?: string }[] = [];

  isRecording: boolean = false;
  mediaRecorder: any;
  audioChunks: any[] = [];
  cancelarAudio: boolean = false;

  isDraggingImage: boolean = false;
  imagenPendiente: string | null = null;
  imagenExpandida: string | null = null;

  flechasDibujadas: { id: string, pathData: string }[] = [];
  cuadroInicioFlecha: string | null = null;

  @ViewChild('cropImageRef') cropImageRef!: ElementRef<HTMLImageElement>;
  cropBox: { x: number, y: number, w: number, h: number } | null = null;
  isDraggingCrop: boolean = false;
  startX: number = 0;
  startY: number = 0;

  ngOnInit(): void {
    this.salaId = this.route.snapshot.params['id'];
    this.esSalaPrivada = this.salaId.length <= 10;
    const rivalId = this.route.snapshot.queryParams['rival'];
    const miId = this.route.snapshot.queryParams['yo'];

    this.initBoard();

    if (miId) {
      this.jugadorService.buscarJugadoresPorId(Number(miId)).subscribe((data) => {
        this.jugador = data;
        this.iniciarPartidaInfo();
        this.iniciarConexionWebSocket();
        this.cdr.detectChanges();
      });
    }

    if (rivalId) {
      this.jugadorService.buscarJugadoresPorId(Number(rivalId)).subscribe((data) => {
        this.rival = data;
        if (this.partida) {
          this.partida.nombreContrincante = `${this.rival.nombreCompleto} ${this.rival.apellidoCompleto}`;
        }
        this.cdr.detectChanges();
      });
    }
    this.cdr.detectChanges();
  }

  iniciarConexionWebSocket() {
    this.stompClient = new Client({
      brokerURL: 'wss://grandmaster-s-edge.onrender.com/ws-chess',
      onConnect: () => {
        this.stompClient.subscribe(`/queue/match/${this.jugador.id}`, (mensaje) => {
          const datos = JSON.parse(mensaje.body);

          if (datos.tipo === 'TIEMPO_PROPUESTO') {
            this.tiempoPropuesto = datos.tiempo;
            this.emisorIdPropuesta = datos.emisorId;
            this.showTiempoPropuestoModal = true;
            this.cdr.detectChanges();
          } else if (datos.tipo === 'RESPUESTA_TIEMPO') {
            if (datos.respuesta === 'ACEPTADO') {
              this.tiempoSeleccionado = datos.tiempo;
              this.resetGame();

              if (!this.soyEspectador) {
                alert('¡El tiempo de la partida se ha actualizado a ' + datos.tiempo + '!');
              }
            } else {
              if (!this.soyEspectador) {
                alert('El oponente rechazó tu propuesta de tiempo.');
              }
            }
            this.cdr.detectChanges();
          } else if (datos.tipo === 'INICIO_PROPUESTO') {
            this.showInicioPropuestoModal = true;
            this.cdr.detectChanges();
          } else if (datos.tipo === 'JUEGO_INICIADO') {
            this.resetGame();
            this.showInicioPropuestoModal = false;
            this.esperandoRival = false;

            if (datos.color === 'espectador') {
              this.soyEspectador = true;
              this.colorAsignado = null;
              if (this.partida) this.partida.estado = 'Sorteando colores...';
              this.cdr.detectChanges();

              setTimeout(() => {
                this.partidaEnCurso = true;
                if (this.partida) this.partida.estado = 'En curso';
                this.iniciarCronometros();
                this.cdr.detectChanges();
              }, 6500);
            } else {
              this.iniciarRuleta(datos.color);
            }
          } else if (datos.tipo === 'INICIO_RECHAZADO') {
            this.esperandoRival = false;
            alert('El oponente indicó que aún no está listo.');
            this.cdr.detectChanges();
          } else if (datos.tipo === 'MOVIMIENTO') {
            this.recibirMovimientoOponente(datos);
          } else if (datos.tipo === 'RENDICION') {
            this.finalizarPartidaPorRendicionOponente();
          } else if (datos.tipo === 'STATS_ACTUALIZADOS') {
            if (datos.eloDelta !== undefined) {
              if (datos.eloDelta > 0) {
                this.eloDeltaMessage = `+${datos.eloDelta} ELO`;
                this.eloDeltaColor = '#4caf50';
              } else if (datos.eloDelta < 0) {
                this.eloDeltaMessage = `${datos.eloDelta} ELO`;
                this.eloDeltaColor = '#f44336';
              } else {
                this.eloDeltaMessage = `+0 ELO`;
                this.eloDeltaColor = '#aaaaaa';
              }
            }

            if (this.jugador?.id) {
              this.jugadorService.buscarJugadoresPorId(this.jugador.id).subscribe((data) => {
                this.jugador = data;
                this.cdr.detectChanges();
              });
            }
            if (this.rival?.id) {
              this.jugadorService.buscarJugadoresPorId(this.rival.id).subscribe((data) => {
                this.rival = data;
                this.cdr.detectChanges();
              });
            }
          } else if (datos.tipo === 'SALA_ABANDONADA') {
            if (!this.partidaEnCurso && this.partida.estado === 'En sala de espera') {
              alert('El oponente ha abandonado la sala. Serás devuelto al menú principal.');
              this.router.navigate(['/menu-principal', this.jugador.id]);
            }
          } else if (datos.tipo === 'RIVAL_UNIDO') {
            this.jugadorService.buscarJugadoresPorId(datos.rivalId).subscribe((data) => {
              this.rival = data;
              if (this.partida) {
                this.partida.nombreContrincante = `${this.rival.nombreCompleto} ${this.rival.apellidoCompleto}`;
              }
              this.cdr.detectChanges();
            });
          } else if (datos.tipo === 'ESTADO_SALA') {
            this.jugadoresEnSala = datos.jugadores;
            this.jugadoresEnSala.forEach((j: any) => {
              if (
                !j.nombreCompleto ||
                j.nombreCompleto.trim() === '' ||
                j.nombreCompleto === 'Jugador' ||
                j.nombreCompleto === 'Conectando...'
              ) {
                j.nombreCompleto = 'Cargando...';
                this.jugadorService.buscarJugadoresPorId(j.id).subscribe((dbData) => {
                  j.nombreCompleto = `${dbData.nombreCompleto} ${dbData.apellidoCompleto}`.trim();
                  j.elo = dbData.elo;
                  this.cdr.detectChanges();
                });
              }
            });
            const miFicha = this.jugadoresEnSala.find((j: any) => j.id === this.jugador.id);
            this.soyLider = miFicha ? miFicha.esLider : false;
            this.soyEspectador = miFicha ? !miFicha.jugando : true;
            const activos = this.jugadoresEnSala.filter((j: any) => j.jugando);
            if (activos.length >= 2 && !this.soyEspectador) {
              const op = activos.find((j: any) => j.id !== this.jugador.id);
              if (op) {
                this.rival = { id: op.id, nombreCompleto: op.nombreCompleto, elo: op.elo } as any;
                if (this.partida) this.partida.nombreContrincante = op.nombreCompleto;
              }
            } else {
              this.rival = null as any;
              if (this.partida) this.partida.nombreContrincante = 'Esperando oponente...';
            }

            this.cdr.detectChanges();
          } else if (datos.tipo === 'VOTACION_INICIADA') {
            this.yaSeVoto = true;
            this.votacionActiva = true;
            this.showVotingModal = true;
            this.tiempoVotacion = 20;
            this.votoEmitido = false;
            const timer = setInterval(() => {
              this.tiempoVotacion--;
              if (this.tiempoVotacion <= 0 || !this.votacionActiva) clearInterval(timer);
              this.cdr.detectChanges();
            }, 1000);
          } else if (datos.tipo === 'VOTACION_TERMINADA') {
            this.votacionActiva = false;
            this.showVotingModal = false;
            this.cdr.detectChanges();
          } else if (datos.tipo === 'PARTIDA_PRIVADA_TERMINADA') {
            this.yaSeVoto = false;
            this.votacionActiva = false;
            if (this.partidaEnCurso || this.soyEspectador) {
              this.partidaEnCurso = false;
              this.limpiarIntervalos();
              if (this.soyEspectador) {
                if (datos.empate) {
                  this.victoryWinnerName = 'Nadie';
                  this.victoryReason = 'Empate o Tablas';
                } else if (datos.ganadorId) {
                  const ganador = this.jugadoresEnSala.find((j: any) => j.id === datos.ganadorId);
                  this.victoryWinnerName = ganador ? ganador.nombreCompleto : 'Jugador';
                  this.victoryReason = 'Victoria';
                } else {
                  this.victoryWinnerName = 'El oponente';
                  this.victoryReason = 'Victoria por abandono';
                }
                this.showVictoryModal = true;
              }
            }

            if (this.partida) this.partida.estado = 'En sala de espera';
            this.cdr.detectChanges();
          }
        });
        this.stompClient.subscribe(`/topic/sala/${this.salaId}/emotes`, (mensaje) => {
          const data = JSON.parse(mensaje.body);
          this.mostrarEmoteEnPantalla(data.nombre, data.emote);
          this.cdr.detectChanges();
        });
        if (this.esSalaPrivada) {
          this.stompClient.publish({
            destination: '/app/solicitarEstadoSala',
            body: JSON.stringify({ salaId: this.salaId }),
          });
        }
        this.stompClient.subscribe(`/topic/sala/${this.salaId}/chat`, (mensaje) => {
          const data = JSON.parse(mensaje.body);
          if (data.tipo === 'ELIMINAR') {
            this.chatMessages = this.chatMessages.filter(msg => msg.id !== data.mensajeId);
            this.cdr.detectChanges();
            return;
          }
          this.chatMessages.push({
            id: data.id,
            nombre: data.emisorNombre,
            texto: data.texto,
            esMio: data.emisorId === this.jugador.id,
            audioData: data.audioData,
            imageData: data.imageData
          });
          this.cdr.detectChanges();
          this.hacerScrollChatAbajo();
        });
      },
    });
    this.stompClient.activate();
  }

  iniciarRuleta(miColor: 'w' | 'b') {
    this.showRuletaModal = true;
    this.ruletaWinnerMessage = 'Sorteando colores...';
    this.ruletaRotation = 0;
    this.cdr.detectChanges();
    const textoColor = miColor === 'w' ? 'las BLANCAS' : 'las NEGRAS';
    setTimeout(() => {
      const targetDeg = miColor === 'w' ? 0 : 180;
      this.ruletaRotation = 360 * 5 + targetDeg;
      this.cdr.detectChanges();
    }, 50);
    setTimeout(() => {
      this.ruletaWinnerMessage = `Tú jugarás como parte de: ${textoColor}`;
      this.colorAsignado = miColor;
      this.turnoJugador = this.colorAsignado === 'w';
      this.cdr.detectChanges();
      setTimeout(() => {
        this.showRuletaModal = false;
        this.partidaEnCurso = true;
        if (this.partida) this.partida.estado = 'En curso';
        this.iniciarCronometros();
        this.cdr.detectChanges();
      }, 2500);
    }, 4050);
  }
  jugar(): void {
    if (!this.partidaEnCurso) {
      this.esperandoRival = true;
      this.stompClient.publish({
        destination: '/app/proponerInicio',
        body: JSON.stringify({ receptorId: this.rival.id }),
      });
      this.stompClient.publish({
        destination: '/app/jugadorListo',
        body: JSON.stringify({ salaId: this.salaId, jugadorId: this.jugador.id }),
      });

      this.cdr.detectChanges();
    } else {
      this.stompClient.publish({
        destination: '/app/rendirse',
        body: JSON.stringify({ receptorId: this.rival ? this.rival.id : null }),
      });

      this.reportarResultadoAlServidor(false);

      this.partidaEnCurso = false;
      this.partida.estado = 'Abandonada';
      this.limpiarIntervalos();
      const nombreValido =
        this.rival && this.rival.nombreCompleto && this.rival.nombreCompleto !== 'Cargando...'
          ? this.rival.nombreCompleto
          : 'Oponente';

      this.victoryWinnerName = nombreValido;
      this.victoryReason = 'Abandonaste la Partida';
      this.showVictoryModal = true;
      this.cdr.detectChanges();
    }
  }
  finalizarPartidaPorRendicionOponente() {
    this.limpiarIntervalos();
    this.partidaEnCurso = false;
    this.partida.estado = 'Finalizada (Victoria por Abandono)';
    this.victoryWinnerName = this.jugador.nombreCompleto;
    this.victoryReason = 'El oponente abandonó la partida';
    this.showVictoryModal = true;
    this.cdr.detectChanges();
  }

  responderInicio(aceptado: boolean): void {
    this.showInicioPropuestoModal = false;
    if (aceptado) {
      this.esperandoRival = true;
      this.stompClient.publish({
        destination: '/app/jugadorListo',
        body: JSON.stringify({ salaId: this.salaId, jugadorId: this.jugador.id }),
      });
    } else {
      this.stompClient.publish({
        destination: '/app/responderInicio',
        body: JSON.stringify({
          respuesta: 'RECHAZADO',
          receptorId: this.rival.id,
        }),
      });
    }
    this.cdr.detectChanges();
  }
  iniciarVotacion() {
    this.stompClient.publish({
      destination: '/app/iniciarVotacion',
      body: JSON.stringify({ salaId: this.salaId }),
    });
  }

  emitirVoto(idTarget: number) {
    if (this.votoEmitido) return;
    this.votoEmitido = true;
    this.stompClient.publish({
      destination: '/app/emitirVoto',
      body: JSON.stringify({ salaId: this.salaId, candidatoId: idTarget }),
    });
  }

  transferirLider(idTarget: number) {
    this.stompClient.publish({
      destination: '/app/transferirLider',
      body: JSON.stringify({ salaId: this.salaId, nuevoLiderId: idTarget }),
    });
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
    this.turnoActualTablero = this.chess.turn() as 'w' | 'b';
    this.cdr.detectChanges();
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
            square: String.fromCharCode(97 + j) + (8 - i),
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
        newPieces = newPieces.filter((p) => p.square !== captureSquare);
      }
      const movedPiece = newPieces.find((p) => p.square === move.from);
      if (movedPiece) {
        movedPiece.square = move.to;
        if (move.promotion) movedPiece.type = move.promotion;
      }
    }

    this.sortCapturedPieces();
    this.pieces = newPieces;
    this.cdr.detectChanges();
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
    if (this.currentReviewIndex !== null) return this.currentReviewIndex === index;
    return index === this.historyFens.length - 1;
  }

  onSquareClick(squareId: string) {
    if (this.soyEspectador) return;
    if (!this.partidaEnCurso) return;
    if (this.currentReviewIndex !== null) return;
    this.borrarFlechas();
    const piece = this.chess.get(squareId as any);
    if (!this.selectedSquare) {
      if (piece && piece.color !== this.colorAsignado) return;
    }
    if (this.chess.turn() !== this.colorAsignado) return;

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
        this.turnoJugador = false;
        this.stompClient.publish({
          destination: '/app/moverPieza',
          body: JSON.stringify({
            salaId: this.esSalaPrivada ? this.salaId : null,
            emisorId: this.jugador.id,
            receptorId: this.rival ? this.rival.id : null,
            from: move.from,
            to: move.to,
            promotion: move.promotion || 'q',
          }),
        });

        this.checkGameOver(move);
        this.cdr.detectChanges();
      }
    } catch (e) {
      console.error('Movimiento ilegal', e);
    }
    this.turnoActualTablero = this.chess.turn() as 'w' | 'b';
    this.cdr.detectChanges();
  }

  recibirMovimientoOponente(datos: any) {
    try {
      if (this.soyEspectador && !this.partidaEnCurso) {
        this.partidaEnCurso = true;
        if (this.partida) this.partida.estado = 'En curso';
        if (this.tiempoTotalSegundos === 0) this.iniciarCronometros();
        this.cdr.detectChanges();
      }
      const move = this.chess.move({ from: datos.from, to: datos.to, promotion: datos.promotion });
      if (move) {
        this.updateVisualBoard(move);
        this.historyFens.push(this.chess.fen());

        if (this.tiempoSeleccionado !== 'Infinito') {
          const acabaDeJugar = move.color;
          const colorAbajo = this.colorAsignado === 'b' ? 'b' : 'w';
          const esRelojDeAbajo = acabaDeJugar === colorAbajo;

          if (esRelojDeAbajo) {
            this.tiempoJugadorSegundos += this.incrementoSegundos;
          } else {
            this.tiempoRivalSegundos += this.incrementoSegundos;
          }
        }

        if (!this.soyEspectador) {
          this.turnoJugador = true;
        }

        this.checkGameOver(move);
        this.cdr.detectChanges();
      }
    } catch (e) {
      console.error('El oponente envió un movimiento ilegal', e);
    }
    this.turnoActualTablero = this.chess.turn() as 'w' | 'b';
    this.cdr.detectChanges();
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
      this.pieces = this.pieces.filter((p) => p.square !== captureSquare);
    }

    const movedPiece = this.pieces.find((p) => p.square === move.from);
    if (movedPiece) {
      movedPiece.square = move.to;
      if (move.promotion) movedPiece.type = move.promotion;
    }
  }

  checkGameOver(move: any): boolean {
    if (this.chess.isCheckmate()) {
      this.limpiarIntervalos();
      this.partidaEnCurso = false;
      if (this.partida) this.partida.estado = 'Finalizada (Jaque Mate)';
      if (!this.soyEspectador) {
        const ganeYo = move.color === this.colorAsignado;
        this.victoryWinnerName = ganeYo
          ? this.jugador.nombreCompleto
          : this.rival
            ? this.rival.nombreCompleto
            : 'Oponente';
        this.victoryReason = '¡Jaque Mate!';
        this.showVictoryModal = true;

        if (ganeYo) {
          this.reportarResultadoAlServidor(true);
        }
      }
      return true;
    } else if (this.chess.isDraw() || this.chess.isStalemate()) {
      this.limpiarIntervalos();
      this.partidaEnCurso = false;
      if (this.partida) this.partida.estado = 'Tablas';

      if (!this.soyEspectador) {
        this.victoryWinnerName = 'Nadie';
        this.victoryReason = '¡Empate!';
        this.showVictoryModal = true;

        if (this.colorAsignado === 'w') {
          this.reportarResultadoAlServidor(false, true);
        }
      }
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

  getColIndex(sq: string): number {
    return sq.charCodeAt(0) - 97;
  }
  getRowIndex(sq: string): number {
    return 8 - parseInt(sq[1]);
  }

  ngOnDestroy(): void {
    this.limpiarIntervalos();
    if (this.stompClient) this.stompClient.deactivate();
  }

  resetGame(): void {
    this.gameSessionId++;
    this.chess = new Chess();
    this.initBoard();
    this.selectedSquare = null;
    this.possibleMoves = [];
    this.captureMoves = [];
    this.turnoJugador = true;
    this.tiempoTotalSegundos = 0;
    this.tiempoJugadorSegundos = 0;
    this.tiempoRivalSegundos = 0;
    this.capturedByWhite = [];
    this.capturedByBlack = [];
    this.eloDeltaMessage = null;

    this.limpiarIntervalos();
    this.historyFens = [];
    this.currentReviewIndex = null;
    this.turnoActualTablero = this.chess.turn() as 'w' | 'b';
    this.cdr.detectChanges();
  }

  iniciarPartidaInfo(): void {
    this.partida = {
      nroPartida: Math.floor(Math.random() * 10000),
      nombreContrincante: 'Esperando oponente...',
      fecha: new Date(),
      duracion: { hours: 0, minutes: 0 } as any,
      nombreGanador: 'Pendiente',
      eloGanadoOPerdido: 0,
      jugador: this.jugador,
      fichas: null as any,
      fichasEliminadas: 0,
      estado: 'En sala de espera',
    };
  }

  ajustarTiempo(): void {
    const index = this.tiemposDisponibles.indexOf(this.tiempoSeleccionado);
    this.selectedTimeIndex = index !== -1 ? index : 7;
    this.showTiempos = true;
    this.cdr.detectChanges();
  }

  limpiarIntervalos(): void {
    if (this.intervalTotal) clearInterval(this.intervalTotal);
    if (this.intervalTurno) clearInterval(this.intervalTurno);
  }

  parsearTiempoASegundos(tiempoString: string): number {
    if (tiempoString === 'Infinito') return -1;
    if (tiempoString.includes('segundos')) return parseInt(tiempoString.split(' ')[0]);
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
    if (this.stompClient) {
      if (this.partidaEnCurso && !this.soyEspectador) {
        this.reportarResultadoAlServidor(false);
      }
      const debeExpulsarRival =
        !this.partidaEnCurso &&
        !this.esSalaPrivada &&
        this.partida.estado === 'En sala de espera' &&
        this.rival;
      this.stompClient.publish({
        destination: '/app/abandonarSala',
        body: JSON.stringify({
          salaId: this.salaId,
          emisorId: this.jugador.id,
          receptorId: debeExpulsarRival ? this.rival.id : null,
        }),
      });
    }
    this.router.navigate(['/menu-principal', this.jugador ? this.jugador.id : '']);
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
        blackIndex: i + 1 < history.length ? i + 1 : null,
      });
    }
    return pairs;
  }

  confirmarTiempo(): void {
    this.showTiempos = false;
    this.stompClient.publish({
      destination: '/app/proponerTiempo',
      body: JSON.stringify({
        salaId: this.salaId,
        tiempo: this.tiemposDisponibles[this.selectedTimeIndex],
        emisorId: this.jugador.id,
        receptorId: this.rival.id,
      }),
    });
  }

  responderPropuesta(aceptado: boolean): void {
    this.showTiempoPropuestoModal = false;
    this.stompClient.publish({
      destination: '/app/responderTiempo',
      body: JSON.stringify({
        respuesta: aceptado ? 'ACEPTADO' : 'RECHAZADO',
        tiempo: this.tiempoPropuesto,
        receptorId: this.emisorIdPropuesta,
        salaId: this.salaId,
      }),
    });
    if (aceptado && !this.esSalaPrivada) {
      this.tiempoSeleccionado = this.tiempoPropuesto;
      this.resetGame();
    }
  }

  iniciarCronometros(): void {
    const limiteSegundos = this.parsearTiempoASegundos(this.tiempoSeleccionado);
    this.tiempoJugadorSegundos = limiteSegundos;
    this.tiempoRivalSegundos = limiteSegundos;
    this.tiempoTotalSegundos = 0;

    this.intervalTotal = window.setInterval(() => {
      this.tiempoTotalSegundos++;
      this.cdr.detectChanges();
    }, 1000);

    this.intervalTurno = window.setInterval(() => {
      if (limiteSegundos !== -1) {
        const colorAbajo = this.colorAsignado === 'b' ? 'b' : 'w';
        const esTurnoDeAbajo = this.turnoActualTablero === colorAbajo;

        if (esTurnoDeAbajo) {
          if (this.tiempoJugadorSegundos > 0) this.tiempoJugadorSegundos--;
        } else {
          if (this.tiempoRivalSegundos > 0) this.tiempoRivalSegundos--;
        }

        if (!this.soyEspectador) {
          if (this.tiempoJugadorSegundos <= 0) {
            this.finalizarPartidaPorTiempo(false);
          } else if (this.tiempoRivalSegundos <= 0) {
            this.finalizarPartidaPorTiempo(true);
          }
        }
      }
      this.cdr.detectChanges();
    }, 1000);
  }

  finalizarPartidaPorTiempo(ganaste: boolean) {
    this.limpiarIntervalos();
    this.partidaEnCurso = false;

    if (!this.soyEspectador) {
      this.victoryWinnerName = ganaste
        ? this.jugador.nombreCompleto
        : this.rival
          ? this.rival.nombreCompleto
          : 'Oponente';
      this.victoryReason = 'Tiempo agotado';
      if (this.partida)
        this.partida.estado = ganaste
          ? 'Finalizada (Victoria por Tiempo)'
          : 'Finalizada (Derrota por Tiempo)';
      this.showVictoryModal = true;

      if (ganaste) {
        this.reportarResultadoAlServidor(true);
      }
    }
    this.cdr.detectChanges();
  }
  reportarResultadoAlServidor(soyGanador: boolean, esEmpate: boolean = false) {
    let payload: any = {
      salaId: this.esSalaPrivada ? this.salaId : null,
    };

    if (esEmpate) {
      payload.ganadorId = this.jugador.id;
      payload.perdedorId = this.rival.id;
      payload.empate = true;
    } else {
      payload.ganadorId = soyGanador ? this.jugador.id : this.rival.id;
      payload.perdedorId = soyGanador ? this.rival.id : this.jugador.id;
      payload.empate = false;
    }

    this.stompClient.publish({
      destination: '/app/finPartida',
      body: JSON.stringify(payload),
    });
  }
  sortCapturedPieces() {
    const pieceValues: any = { q: 9, r: 5, b: 3, n: 3, p: 1 };
    this.capturedByWhite.sort((a, b) => pieceValues[b] - pieceValues[a]);
    this.capturedByBlack.sort((a, b) => pieceValues[b] - pieceValues[a]);
  }
  toggleMenuEmotes() {
    this.mostrarMenuEmotes = !this.mostrarMenuEmotes;
  }
  enviarEmote(emote: string) {
    this.mostrarMenuEmotes = false;
    const miNombre = this.jugador ? this.jugador.nombreCompleto : 'Espectador';
    const payload = {
      salaId: this.salaId,
      nombre: miNombre,
      emote: emote,
    };
    this.stompClient.publish({
      destination: '/app/enviarEmote',
      body: JSON.stringify(payload),
    });
  }
  mostrarEmoteEnPantalla(nombre: string, emote: string) {
    const nuevoEmote = { id: Date.now(), nombre, emote };
    this.emotesActivos.push(nuevoEmote);
    setTimeout(() => {
      this.emotesActivos = this.emotesActivos.filter((e) => e.id !== nuevoEmote.id);
      this.cdr.detectChanges();
    }, 3000);
  }
  get emotesFiltrados() {
    if (!this.searchTerm) return this.emotesDisponibles;
    return this.emotesDisponibles.filter(e => e.name.toLowerCase().includes(this.searchTerm.toLowerCase()));
  }
  toggleFavorito(emote: any, event: Event) {
    event.stopPropagation();
    const index = this.emotesFavoritos.findIndex(e => e.icon === emote.icon);

    if (index !== -1) {
      this.emotesFavoritos.splice(index, 1);
    } else {
      if (this.emotesFavoritos.length < 9) {
        this.emotesFavoritos.push(emote);
      } else {
        alert('Solo puedes tener un máximo de 9 emotes favoritos asignados al teclado.');
      }
    }
  }
  esFavorito(emote: any): boolean {
    return this.emotesFavoritos.some(e => e.icon === emote.icon);
  }
  toggleChat() {
    this.mostrarChat = !this.mostrarChat;
    if (this.mostrarChat) {
      setTimeout(() => this.hacerScrollChatAbajo(), 100);
    }
  }
  enviarMensajeChat() {
    if (!this.nuevoMensaje.trim()) return;
    const nombreCompletoRemitente = this.jugador
      ? `${this.jugador.nombreCompleto || ''} ${this.jugador.apellidoCompleto || ''}`.trim()
      : 'Espectador';
    const payload = {
      salaId: this.salaId,
      id: Date.now().toString(),
      emisorId: this.jugador.id,
      emisorNombre: nombreCompletoRemitente,
      texto: this.nuevoMensaje
    };
    this.stompClient.publish({
      destination: '/app/enviarChat',
      body: JSON.stringify(payload)
    });
    this.nuevoMensaje = '';
  }
  hacerScrollChatAbajo() {
    const chatFeed = document.querySelector('.chat-messages');
    if (chatFeed) {
      chatFeed.scrollTop = chatFeed.scrollHeight;
    }
  }
  async toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  cancelRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.cancelarAudio = true;
      this.mediaRecorder.stop();
    }
  }

  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const opciones = { audioBitsPerSecond: 16000 };
      this.mediaRecorder = new MediaRecorder(stream, opciones);
      this.audioChunks = [];
      this.cancelarAudio = false;
      this.mediaRecorder.ondataavailable = (event: any) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      this.mediaRecorder.onstop = () => {
        if (!this.cancelarAudio) {
          const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder.mimeType });
          this.convertBlobToBase64(audioBlob).then(base64 => {
            this.enviarMensajeVoz(base64 as string);
          });
        }
        stream.getTracks().forEach(track => track.stop());
        this.isRecording = false;
        this.cdr.detectChanges();
      };
      this.mediaRecorder.start();
      this.isRecording = true;
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Error al acceder al micrófono', err);
      alert('Debes conceder permisos de micrófono para enviar notas de voz.');
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.cancelarAudio = false;
      this.mediaRecorder.stop();
    }
  }

  convertBlobToBase64(blob: Blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  enviarMensajeVoz(base64Audio: string) {
    const nombreCompletoRemitente = this.jugador
      ? `${this.jugador.nombreCompleto || ''} ${this.jugador.apellidoCompleto || ''}`.trim()
      : 'Espectador';

    const payload = {
      salaId: this.salaId,
      id: Date.now().toString(),
      emisorId: this.jugador ? this.jugador.id : null,
      emisorNombre: nombreCompletoRemitente,
      texto: 'Mensaje de voz',
      audioData: base64Audio
    };

    this.stompClient.publish({
      destination: '/app/enviarChat',
      body: JSON.stringify(payload)
    });
  }

  borrarMensaje(mensajeId: string) {
    const payload = {
      salaId: this.salaId,
      tipo: 'ELIMINAR',
      mensajeId: mensajeId
    };
    this.stompClient.publish({
      destination: '/app/enviarChat',
      body: JSON.stringify(payload)
    });
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (this.mostrarChat) {
      this.isDraggingImage = true;
    }
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingImage = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingImage = false;

    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      this.procesarArchivoImagen(file);
    }
  }

  prevenirMenuContextual(event: MouseEvent) {
    event.preventDefault();
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

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }
    if (['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(event.key)) {
      const index = parseInt(event.key) - 1;
      if (this.emotesFavoritos[index]) {
        this.enviarEmote(this.emotesFavoritos[index].icon);
      }
    }
  }
  @HostListener('document:click', ['$event'])
  cerrarMenuAlHacerClicFuera(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (this.mostrarMenuEmotes && !target.closest('.emote-controls')) {
      this.mostrarMenuEmotes = false;
    }
    if (this.mostrarChat && !target.closest('.chat-system-wrapper')) {
      this.mostrarChat = false;
    }
  }
  @HostListener('window:paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    if (!this.mostrarChat) return;
    const items = event.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) this.procesarArchivoImagen(file);
          break;
        }
      }
    }
  }

  procesarArchivoImagen(file: File) {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecciona un archivo de imagen válido.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagenPendiente = e.target.result;
      this.cropBox = null;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  enviarImagenPendiente() {
    if (this.imagenPendiente) {
      this.enviarMensajeImagen(this.imagenPendiente);
      this.imagenPendiente = null;
      setTimeout(() => this.hacerScrollChatAbajo(), 100);
    }
  }

  descartarImagen() {
    this.imagenPendiente = null;
    this.cropBox = null;
  }

  expandirImagen(base64: string) {
    this.imagenExpandida = base64;
  }

  cerrarImagenExpandida() {
    this.imagenExpandida = null;
  }

  startCrop(e: MouseEvent) {
    this.isDraggingCrop = true;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    this.startX = e.clientX - rect.left;
    this.startY = e.clientY - rect.top;
    this.cropBox = { x: this.startX, y: this.startY, w: 0, h: 0 };
  }

  moveCrop(e: MouseEvent) {
    if (!this.isDraggingCrop || !this.cropBox) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    let currentX = e.clientX - rect.left;
    let currentY = e.clientY - rect.top;

    currentX = Math.max(0, Math.min(currentX, rect.width));
    currentY = Math.max(0, Math.min(currentY, rect.height));

    this.cropBox.x = Math.min(this.startX, currentX);
    this.cropBox.y = Math.min(this.startY, currentY);
    this.cropBox.w = Math.abs(currentX - this.startX);
    this.cropBox.h = Math.abs(currentY - this.startY);
  }

  endCrop() {
    this.isDraggingCrop = false;
  }

  aplicarRecorte() {
    if (!this.cropBox || this.cropBox.w < 10 || this.cropBox.h < 10) {
      this.cropBox = null; return;
    }

    const img = this.cropImageRef.nativeElement;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = img.getBoundingClientRect();
    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;

    canvas.width = this.cropBox.w * scaleX;
    canvas.height = this.cropBox.h * scaleY;

    ctx.drawImage(img, this.cropBox.x * scaleX, this.cropBox.y * scaleY, this.cropBox.w * scaleX, this.cropBox.h * scaleY, 0, 0, canvas.width, canvas.height);
    this.imagenPendiente = canvas.toDataURL('image/png');
    this.cropBox = null;
  }

  @HostListener('document:keydown.enter', ['$event'])
  enviarConEnter(event: Event) {
    if (this.imagenPendiente) {
      event.preventDefault();
      this.enviarImagenPendiente();
    }
  }

  enviarMensajeImagen(base64Image: string) {
    const nombreCompletoRemitente = this.jugador
      ? `${this.jugador.nombreCompleto || ''} ${this.jugador.apellidoCompleto || ''}`.trim()
      : 'Espectador';
    const payload = {
      salaId: this.salaId,
      id: Date.now().toString(),
      tipo: 'MENSAJE',
      emisorId: this.jugador ? this.jugador.id : null,
      emisorNombre: nombreCompletoRemitente,
      texto: 'Imagen',
      imageData: base64Image
    };
    this.stompClient.publish({
      destination: '/app/enviarChat',
      body: JSON.stringify(payload)
    });
  }
}
