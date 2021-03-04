import { Component, OnInit } from '@angular/core';
import { Alumno, Juego, Pregunta } from 'src/app/clases';
import { ComServerService, PeticionesAPIService, SesionService } from 'src/app/servicios';
import Swal from 'sweetalert2';
import * as URL from 'src/app/URLs/urls';
import { NgxEchartsModule } from 'ngx-echarts';
import { MatTableDataSource } from '@angular/material';

@Component({
  selector: 'app-gestion-pregunta-kahoot',
  templateUrl: './gestion-pregunta-kahoot.component.html',
  styleUrls: ['./gestion-pregunta-kahoot.component.scss']
})
export class GestionPreguntaKahootComponent implements OnInit {
  
  // Juego de Cuestionario seleccionado
   juegoSeleccionado: Juego;

   //Para cargar la pregunta mostrada
   preguntasCuestionario: Pregunta[];
   preguntaCargada: Pregunta;
 
    // Recuperamos la informacion del juego
    alumnosDelJuego: Alumno[];

    //Indice para conseguir la pregunta
    indicePregunta: number;

    //Para cargar la Imagen
    imagenPregunta: string;

    //Para almacenar las respuestas recibidas
    respuestasAlumnos: any[];

    //Para almacenar los alumnos que han contestado cada pregunta
    indicesRespuestas: number = -1;
    alumnosConRespuestaCorrecta = [];
    alumnosConRespuestaIncorrecta1 = [];
    alumnosConRespuestaIncorrecta2 = [];
    alumnosConRespuestaIncorrecta3 = [];

    //Para desactivar/activar los botones y la tabla
    isDisabled: Boolean = true;
    tablaIsDisabled: Boolean = true;

    //Timer y variable usados para tiempo de respuesta de las preguntas
    intervalTiempoRespuesta;
    segundosRespuesta: number;
    intervalCargarRespuesta;
    segundosCarga: number = 4;
    cargandoPregunta: Boolean;
    tiempoDeRespuesta: number;

    //Para rellenar la tabla de clasificación
    rankingAlumnos: any [];
    dataSourceRankingAlumnos;
    displayedColumnsRankingAlumnos: string[] = ['nombreAlumno', 'primerApellido', 'segundoApellido', 'puntos', 'puntosTotales'];

    //Array para guardar los puntos totales de los jugadores
    puntosTotales: any[];
  
    //Opción escogida para los gráficos
    donut = {

      tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
          orient: 'vertical',
          left: 10,
          data: ['respuesta Correcta', 'respuesta Incorrecta 1', 'respuesta Incorrecta 2', 'respuesta Incorrecta 3']
      },
      series: [
          {
              name: '# de respuestas',
              type: 'pie',
              radius: ['50%', '70%'],
              avoidLabelOverlap: false,
              label: {
                  show: false,
                  position: 'center'
              },
              emphasis: {
                  label: {
                      show: true,
                      fontSize: '30',
                      fontWeight: 'bold'
                  }
              },
              labelLine: {
                  show: false
              },
              data: [
                  {value: this.alumnosConRespuestaCorrecta.length, name: 'respuesta Correcta'},
                  {value: this.alumnosConRespuestaIncorrecta1.length, name: 'respuesta Incorrecta 1'},
                  {value: this.alumnosConRespuestaIncorrecta2.length, name: 'respuesta Incorrecta 2'},
                  {value: this.alumnosConRespuestaIncorrecta3.length, name: 'respuesta Incorrecta 3'}
              ]
          }
      ]
  };
  
  constructor(public sesion: SesionService,
              public peticionesAPI: PeticionesAPIService,
              public comServer: ComServerService) {}
  
  ngOnInit() {
    this.respuestasAlumnos = [];

    this.rankingAlumnos = [];

    this.puntosTotales = [];

    //Iniciamos los timers
    this.IniciarTimers();

    //Recuperamos el juego
    this.juegoSeleccionado = this.sesion.DameJuego();
    this.segundosRespuesta = this.juegoSeleccionado.TiempoLimite;
    this.tiempoDeRespuesta = this.juegoSeleccionado.TiempoLimite;

    //Recuperamos los alumnos inscritos en el juego
    this.AlumnosDelJuego();

    //Recuperamos las preguntas asociadas al juego de cuestionario
    this.DamePreguntasDelJuego();

    //Cargamos la espera de respuestas de los alumnos
    this.EsperoRespuestaAlumno();

  }

  DamePreguntasDelJuego(){
    this.peticionesAPI.DamePreguntasCuestionario(this.juegoSeleccionado.cuestionarioId)
      .subscribe(res => {
       this.preguntasCuestionario = res;
       
       //Seleccionamos la primera pregunta
      this.preguntaCargada = this.preguntasCuestionario[0];

      //Recuperamos la imagen de la primera pregunta
      this.TraeImagenPregunta(this.preguntaCargada);

      //Iniciamos el índice para la siguiente pregunta
      this.indicePregunta = 1;
     })
     
  }

  Siguiente(){

     //Seleccionamos la pregunta
     console.log("VOY A MOSTRAR LA PREGUNTA: " +this.indicePregunta);
     if (this.indicePregunta < this.preguntasCuestionario.length){
        this.preguntaCargada = this.preguntasCuestionario[this.indicePregunta];
        
        //Una vez cargada la nueva pregunta, actualizamos su imagen
        this.TraeImagenPregunta(this.preguntaCargada);
        
        //Dejamos el índice preparado para la próxima pregunta
        this.indicePregunta ++;

        //Después de avanzar de pregunta, necesitamos resetear los array que almacenan las respuestas
        this.respuestasAlumnos = [];
        this.alumnosConRespuestaCorrecta = [];
        this.alumnosConRespuestaIncorrecta1 = [];
        this.alumnosConRespuestaIncorrecta2 = [];
        this.alumnosConRespuestaIncorrecta3 = [];
        
        //Reseteamos el array que alimenta la tabla
        this.rankingAlumnos = [];

        //Volvemos a deshabilitar los botones
        this.isDisabled= true;
        this.tablaIsDisabled = true;

        //PARTE SERVIDOR
        //Para mostrar las nuevas respuestas en el móvil del alumno
        this.comServer.AvanzarPregunta(this.juegoSeleccionado.grupoId);

        this.IniciarTimers();


     }else{
        Swal.fire('Error', 'No hay más preguntas', 'error');
     }
  } 
  
  // Recuperamos la imagen asociada a la pregunta.
  TraeImagenPregunta(pregunta: Pregunta) {
    // Si la pregunta tiene una foto (recordemos que la foto no es obligatoria)
    if (pregunta.Imagen !== undefined) {
      this.imagenPregunta = URL.ImagenesPregunta + pregunta.Imagen ;
      console.log (this.imagenPregunta);

      // Si no, la imagenPregunta será undefined para que no nos pinte la foto de otro equipo préviamente seleccionado
    } else {
      this.imagenPregunta = undefined;
    }

  }

  //Para recibir las respuestas de los alumnos
  EsperoRespuestaAlumno(){
    this.comServer.EsperoRespuestasCuestionarioKahoot().subscribe((respuesta) =>{
      console.log("Recibo respuesta del alumno " + respuesta.alumnoId + ":" + respuesta.respuesta + ". Que ha conseguido: " + respuesta.puntosConseguidos +" puntos");
      
      //Guardamos la respuesta recibida
      this.respuestasAlumnos.push({
        alumnoId: respuesta.alumnoId,
        respuestaAlumno: respuesta.respuesta,
        puntos: respuesta.puntosConseguidos
      });

      //Almacenamos en el vector de puntosTotales cada vez que recibimos los puntos obtenidos por un alumno
      this.puntosTotales.push({
        alumnoId: respuesta.alumnoId,
        puntos: respuesta.puntosConseguidos
      });

      //Después de recibir la respuesta, la catalogamos
      this.RespuestaDeTipo(respuesta.respuesta, respuesta.alumnoId);

      //Comprobamos si podemos activar los botones
      this.Disabled();
    });
  }

  //Guardamos la respuesta recibida en el vector de respuestas correspondiente para el gráfico
  RespuestaDeTipo(respuestaRecibida: string, alumnoId: string){
    
    let respuestaCorrecta = this.preguntaCargada.RespuestaCorrecta;
    let respuestaIncorrecta1 = this.preguntaCargada.RespuestaIncorrecta1;
    let respuestaIncorrecta2 = this.preguntaCargada.RespuestaIncorrecta2;
    let respuestaIncorrecta3 = this.preguntaCargada.RespuestaIncorrecta3;
    
    //Comprobamos qué respuesta ha dado el alumno y lo guardamos en el array correspondiente
    if(respuestaRecibida === respuestaCorrecta){
      this.alumnosConRespuestaCorrecta.push(alumnoId);
      console.log( "La respuesta correcta es: " + respuestaCorrecta + "y la recibida es: " + respuestaRecibida)
    }else if(respuestaRecibida === respuestaIncorrecta1){
      this.alumnosConRespuestaIncorrecta1[this.alumnosConRespuestaIncorrecta1.length] = alumnoId;
      console.log( "La respuesta incorrecta #1 es: " + respuestaIncorrecta1 + "y la recibida es: " + respuestaRecibida)
    }else if(respuestaRecibida === respuestaIncorrecta2){
      this.alumnosConRespuestaIncorrecta2[this.alumnosConRespuestaIncorrecta2.length] = alumnoId;
      console.log( "La respuesta incorrecta #2 es: " + respuestaIncorrecta2 + "y la recibida es: " + respuestaRecibida)
    }else if(respuestaRecibida === respuestaIncorrecta3){
      this.alumnosConRespuestaIncorrecta3[this.alumnosConRespuestaIncorrecta3.length] = alumnoId;
      console.log( "La respuesta incorrecta #3 es: " + respuestaIncorrecta3 + "y la recibida es: " + respuestaRecibida)
    }

    this.ActualizaElGrafico();
  }

  //Para actualizar los datoss del gráfico con cada respuesta
  ActualizaElGrafico(){

    this.donut = {

      tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
          orient: 'vertical',
          left: 10,
          data: ['respuesta Correcta', 'respuesta Incorrecta 1', 'respuesta Incorrecta 2', 'respuesta Incorrecta 3']
      },
      series: [
          {
              name: '# de respuestas',
              type: 'pie',
              radius: ['50%', '70%'],
              avoidLabelOverlap: false,
              label: {
                  show: false,
                  position: 'center'
              },
              emphasis: {
                  label: {
                      show: true,
                      fontSize: '30',
                      fontWeight: 'bold'
                  }
              },
              labelLine: {
                  show: false
              },
              data: [
                  {value: this.alumnosConRespuestaCorrecta.length, name: 'respuesta Correcta'},
                  {value: this.alumnosConRespuestaIncorrecta1.length, name: 'respuesta Incorrecta 1'},
                  {value: this.alumnosConRespuestaIncorrecta2.length, name: 'respuesta Incorrecta 2'},
                  {value: this.alumnosConRespuestaIncorrecta3.length, name: 'respuesta Incorrecta 3'}
              ]
          }
      ]
  };
  }

  //Para cargar la tabla con el Ranking de los alumnos
  CargarRankingAlumnos(){
    this.respuestasAlumnos.forEach(element => {
      this.alumnosDelJuego.forEach(alumnoJuego =>{ 
        if(alumnoJuego.id == element.alumnoId){
          this.rankingAlumnos.push({
            alumnoId: alumnoJuego.id,
            nombreAlumno: alumnoJuego.Nombre,
            primerApellido: alumnoJuego.PrimerApellido,
            segundoApellido: alumnoJuego.SegundoApellido,
            puntos: element.puntos,
            puntosTotales: 0
          });
        }
      })
    })

    //Antes de cargar la tabla, es necesario calcular los puntos acumulados de cada jugador
    this.CalcularPuntosTotales();

    //Ordenamos los alumnos según su puntuación
    this.rankingAlumnos.sort(
      function(a, b) {          
            return b.puntosTotales - a.puntosTotales;
      });
      
    //Cargamos los alumnos cómo alimentación de la tabla con el ranking
    this.dataSourceRankingAlumnos = new MatTableDataSource(this.rankingAlumnos);

    //Hacemos visible la tabla
    this.tablaIsDisabled = false;
  }
  
  /* Método para calcular los puntos totales del alumno después de cada pregunta.*/
  CalcularPuntosTotales(){
    console.log("Calculamos puntos totales");
    this.puntosTotales.forEach(puntosAlumno => {
      this.rankingAlumnos.forEach(alumnoEnRanking =>{
        if(puntosAlumno.alumnoId == alumnoEnRanking.alumnoId){
          console.log( "El alumno tenía: " + alumnoEnRanking.puntosTotales + " puntos");
          console.log( "El alumno ha hecho: " + puntosAlumno.puntos + " puntos");
          let totalPuntos = alumnoEnRanking.puntosTotales + puntosAlumno.puntos;
          alumnoEnRanking.puntosTotales = totalPuntos;
          console.log( "El alumno tiene: " + alumnoEnRanking.puntosTotales + " puntos");
        }
      })
    })
  }  

  //Método que sirve para comprobar que todos los alumnos han contestado antes de habilitar los botones mostrar gráfico y siguiente
  Disabled() {
    //Si la longitud del array respuestasAlumnos es diferente del # de respuestas esperadas, los botones estaran desactivados
    console.log("LA LONGITUD DEL ARRAY RESPUESTASALUMNOS ES: " +this.respuestasAlumnos.length);
    console.log("LA LONGITUD DEL ARRAY PREGUNTASCUESTIONARIOS ES: " +this.alumnosDelJuego.length);
    if (this.respuestasAlumnos.length !== this.alumnosDelJuego.length) {
      this.isDisabled = true;
    } else {
      this.CargarRankingAlumnos();
      clearInterval(this.intervalTiempoRespuesta);
      this.isDisabled = false;
    }
  }

  //Para recuperar los alumnos del juego
  AlumnosDelJuego() {
    this.peticionesAPI.DameAlumnosJuegoDeCuestionario(this.juegoSeleccionado.id)
    .subscribe(alumnosJuego => {
      this.alumnosDelJuego = alumnosJuego;
    });
  }

  //Método para  iniciar los timeInterval necesarios para cargar la pregunta y el tiempo de respuesta
  IniciarTimers(){
    this.cargandoPregunta = true;
    this.segundosRespuesta = this.tiempoDeRespuesta;
    
    //Primero, cargamos el timer para la carga de la pregunta
    this.intervalCargarRespuesta = setInterval(() => {
      //Cada segundo que pasa, reducimos la variable segundosCarga en 1
      this.segundosCarga --;
      if(this.segundosCarga == 0){
        clearInterval(this.intervalCargarRespuesta);
        this.cargandoPregunta = false;
        this.segundosCarga = 4;

        //Una vez ha pasado el tiempo para mostrar la pregunta, iniciamos el timer para contestarla.
        this.intervalTiempoRespuesta = setInterval(() => {
          //Cada segundo que pasa, reducimos la variable segundosRespuesta en 1
          this.segundosRespuesta --;
          if(this.segundosRespuesta == 0){
            clearInterval(this.intervalTiempoRespuesta);
            this.isDisabled = false;
            this.segundosRespuesta = this.juegoSeleccionado.TiempoLimite;
          }
        }, 1000);
          }
    }, 1000)
  }
}
