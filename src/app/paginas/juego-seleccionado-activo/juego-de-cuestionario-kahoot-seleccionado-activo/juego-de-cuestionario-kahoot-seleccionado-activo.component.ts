import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material';
import { Router } from '@angular/router';
import { Alumno, Cuestionario, Juego, Pregunta } from 'src/app/clases';
import { SesionService, PeticionesAPIService, CalculosService, ComServerService } from 'src/app/servicios';

@Component({
  selector: 'app-juego-de-cuestionario-kahoot-seleccionado-activo',
  templateUrl: './juego-de-cuestionario-kahoot-seleccionado-activo.component.html',
  styleUrls: ['./juego-de-cuestionario-kahoot-seleccionado-activo.component.scss']
})


export class JuegoDeCuestionarioKahootSeleccionadoActivoComponent implements OnInit {

  // Juego de Cuestionario saleccionado
  juegoSeleccionado: Juego;
  preguntasCuestionario: Pregunta[];
  preguntaCargada: Pregunta;

   // Recuperamos la informacion del juego
   alumnosDelJuego: Alumno[];

  //Lista para tratado de conexiones
  alumnosConectados: any[];
  
  dataSourceAlumnosConectados;
  displayedColumnsAlumnosKahoot: string[] = ['nombreAlumno', 'primerApellido', 'segundoApellido', 'conexion']; 
  
  constructor(public sesion: SesionService,
              public peticionesAPI: PeticionesAPIService,
              public comServer: ComServerService,
              private route: Router) { }

  ngOnInit() {
    this.alumnosConectados = [];
    this.juegoSeleccionado = this.sesion.DameJuego();
    this.AlumnosDelJuego();
   
    //Nos suscribimos al método para que actualice el estado de la conexión al juego cuando un alumno entra
  console.log("Esperando conexiones de alumnos");
  this.comServer.EsperoConexionesCuestionarioKahoot().subscribe((respuesta) =>{
    console.log("Se ha conectado un alumno");
    this.MeConectoAKahoot(respuesta);
  });
  }


  DamePreguntasDelJuego(){
    this.peticionesAPI.DamePreguntasCuestionario(this.juegoSeleccionado.cuestionarioId)
      .subscribe(res => {
       this.preguntasCuestionario = res;
     })
     console.log(this.preguntasCuestionario);
  }

  AlumnosDelJuego() {
    this.peticionesAPI.DameAlumnosJuegoDeCuestionario(this.juegoSeleccionado.id)
    .subscribe(alumnosJuego => {
      this.alumnosDelJuego = alumnosJuego;
      this.alumnosDelJuego.forEach(al => {
        this.alumnosConectados.push({
          alumno: al, 
          conectado: false
        })
      })
      this.dataSourceAlumnosConectados = new MatTableDataSource(this.alumnosConectados);
    });
  }
 
  //Método para gestionar la conexión de los alumnos en la modalidad Kahoot
  MeConectoAKahoot(idAlumno: number){

    this.alumnosConectados.filter(item => item.alumno.id === idAlumno)[0].conectado = true;
    //Después de actualizar el item con la conexión, debemos volver a cargar la tabla.
    this.dataSourceAlumnosConectados = new MatTableDataSource(this.alumnosConectados);
  }
  //Para abrir la ventana de juego de Kahoot

  IniciarJuegoKahoot() {
    this.comServer.EmpezarJuegoKahoot(this.juegoSeleccionado.grupoId);
    console.log("Iniciamos navegación");
    this.route.navigate (['grupo/' + this.juegoSeleccionado.profesorId+ '/juegos/juegoSeleccionadoActivo/gestionarPreguntaKahoot']);
  }
  
  
}
