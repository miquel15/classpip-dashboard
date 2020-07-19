import { Component, OnInit } from '@angular/core';
import {SesionService, PeticionesAPIService, CalculosService} from '../../../servicios/index';
import Swal from 'sweetalert2';
import { Location } from '@angular/common';

// Clases
import { Alumno, Equipo, Juego, Punto, Nivel, AlumnoJuegoDePuntos, EquipoJuegoDePuntos,
  TablaAlumnoJuegoDePuntos, TablaEquipoJuegoDePuntos, JuegoDeAvatar, AlumnoJuegoDeAvatar } from '../../../clases/index';
import { MatDialog } from '@angular/material';
/* Necesario para controlar qué filas están seleccionadas */
import {SelectionModel} from '@angular/cdk/collections';

import {MatTableDataSource} from '@angular/material/table';



@Component({
  selector: 'app-juego-de-avatar-seleccionado-activo',
  templateUrl: './juego-de-avatar-seleccionado-activo.component.html',
  styleUrls: ['./juego-de-avatar-seleccionado-activo.component.scss']
})
export class JuegoDeAvatarSeleccionadoActivoComponent implements OnInit {

  juegoSeleccionado: Juego;
  alumnosDelJuego: Alumno[];
  inscripcionesAlumnosJuegodeAvatar: AlumnoJuegoDeAvatar[];
  selection1 = new SelectionModel<any>(true, []);
  selection2 = new SelectionModel<any>(true, []);
  selection3 = new SelectionModel<any>(true, []);
  selection4 = new SelectionModel<any>(true, []);
  selection5 = new SelectionModel<any>(true, []);
  selection6 = new SelectionModel<any>(true, []);
  datasourceAlumnos;
  haCambiado: boolean[];
  hayCambios: boolean = false;

  // tslint:disable-next-line:max-line-length
  displayedColumns: string[] = ['nombre', 'primerApellido', 'segundoApellido', 'privilegio1', 'privilegio2', 'privilegio3', 'privilegio4', 'privilegio5', 'privilegio6', ' '];
  constructor(
    public dialog: MatDialog,
    private calculos: CalculosService,
    private sesion: SesionService,
    private peticionesAPI: PeticionesAPIService,
    private location: Location ) { }
  ngOnInit() {
    this.juegoSeleccionado = this.sesion.DameJuego();
    console.log ('Ya tengo el juego');
    console.log (this.juegoSeleccionado);

    if (this.juegoSeleccionado.Modo === 'Individual') {
     this.AlumnosDelJuego();
    } else {
      //this.EquiposDelJuego();
    }
  }


  // Recupera los alumnos que pertenecen al juego
  AlumnosDelJuego() {
    console.log ('Vamos a pos los alumnos');
    console.log (this.juegoSeleccionado.id);
    this.peticionesAPI.DameAlumnosJuegoDeAvatar(this.juegoSeleccionado.id)
    .subscribe(alumnosJuego => {
      console.log ('Ya tengo los alumnos');
      console.log(alumnosJuego);
      this.alumnosDelJuego = alumnosJuego;
      // En este vector tomaré nota de si han cambiado los privilegios de cada alumno
      // para luego decidir qué alumnos tengo que actualizar en la base de datos
      this.haCambiado = Array(this.alumnosDelJuego.length).fill(false);
      // Cuando tengo los alumnos recupero las inscripciones
      this.RecuperarInscripcionesAlumnoJuego();

    });
  }

  RecuperarInscripcionesAlumnoJuego() {
    this.peticionesAPI.DameInscripcionesAlumnoJuegoDeAvatar(this.juegoSeleccionado.id)
    .subscribe(inscripciones => {
      this.inscripcionesAlumnosJuegodeAvatar = inscripciones;
      // Ahora preparo la tabla que se va a mostrar
      this.PrepararTabla ();
    });
  }

  PrepararTabla() {
    this.datasourceAlumnos = new MatTableDataSource(this.alumnosDelJuego);
    // Cada uno de los privilegios tiene un selector. Tengo que seleccionar los privilegios activos para cada
    // selector y para cada alumno
    this.datasourceAlumnos.data.forEach(row => {
      // recorro los alumnos y para cada uno de ellos obtengo su inscripción
      const inscripcion = this.inscripcionesAlumnosJuegodeAvatar.filter (ins => ins.alumnoId === row.id)[0];
      // Ahora activo o desactivo el selector de cada privilegio según tenga el alumno ese privilegio o no
      if (inscripcion.Privilegios[0]) {
        this.selection1.select(row);
      } else {
        this.selection1.deselect(row);
      }
      if (inscripcion.Privilegios[1]) {
        this.selection2.select(row);
      } else {
        this.selection2.deselect(row);
      }
      if (inscripcion.Privilegios[2]) {
        this.selection3.select(row);
      } else {
        this.selection3.deselect(row);
      }
      if (inscripcion.Privilegios[3]) {
        this.selection4.select(row);
      } else {
        this.selection4.deselect(row);
      }
      if (inscripcion.Privilegios[4]) {
        this.selection5.select(row);
      } else {
        this.selection5.deselect(row);
      }
      if (inscripcion.Privilegios[5]) {
        this.selection6.select(row);
      } else {
        this.selection6.deselect(row);
      }

    });

  }

  /* Para averiguar si todos los elementos de un selector determinado están activos o no  */
  IsAllSelected(n) {
    let numSelected;
    if (n === 1) {
      numSelected = this.selection1.selected.length;
    }
    if (n === 2) {
      numSelected = this.selection2.selected.length;
    }
    if (n === 3) {
      numSelected = this.selection3.selected.length;
    }
    if (n === 4) {
      numSelected = this.selection4.selected.length;
    }
    if (n === 5) {
      numSelected = this.selection5.selected.length;
    }
    if (n === 6) {
      numSelected = this.selection6.selected.length;
    }
    const numRows = this.datasourceAlumnos.data.length;
    return numSelected === numRows;
  }


  // Esta función se ejecuta cuando clicamos en el checkbox de cabecera

  MasterToggle(n) {

      if (n === 1) {
        if (this.IsAllSelected(1)) {
          // Si todos los elementos del selector estan activos hay que desactivarlos todos
          this.selection1.clear(); // Desactivamos todos
          // y quitar el privilegio correspondiente a todos los alumnos
          this.inscripcionesAlumnosJuegodeAvatar.forEach (inscripcion => inscripcion.Privilegios[0] = false);
        } else {
          // Tengo que activar todos los elementos del selector
          this.datasourceAlumnos.data.forEach(row => this.selection1.select(row));
          // y conceder el privilegio correspondiente a todos los alumnos
          this.inscripcionesAlumnosJuegodeAvatar.forEach (inscripcion => inscripcion.Privilegios[0] = true);
        }
      }
      if (n === 2) {
        if (this.IsAllSelected(2)) {
          this.selection2.clear(); // Desactivamos todos
          this.inscripcionesAlumnosJuegodeAvatar.forEach (inscripcion => inscripcion.Privilegios[1] = false);
        } else {
          this.datasourceAlumnos.data.forEach(row => this.selection2.select(row));
          this.inscripcionesAlumnosJuegodeAvatar.forEach (inscripcion => inscripcion.Privilegios[1] = true);
        }
      }
      if (n === 3) {
        if (this.IsAllSelected(3)) {
          this.selection3.clear(); // Desactivamos todos
          this.inscripcionesAlumnosJuegodeAvatar.forEach (inscripcion => inscripcion.Privilegios[2] = false);
        } else {
          this.datasourceAlumnos.data.forEach(row => this.selection3.select(row));
          this.inscripcionesAlumnosJuegodeAvatar.forEach (inscripcion => inscripcion.Privilegios[2] = true);
        }
      }
      if (n === 4) {
        if (this.IsAllSelected(4)) {
          this.selection4.clear(); // Desactivamos todos
          this.inscripcionesAlumnosJuegodeAvatar.forEach (inscripcion => inscripcion.Privilegios[3] = false);
        } else {
          this.datasourceAlumnos.data.forEach(row => this.selection4.select(row));
          this.inscripcionesAlumnosJuegodeAvatar.forEach (inscripcion => inscripcion.Privilegios[3] = true);
        }
      }
      if (n === 5) {
        if (this.IsAllSelected(5)) {
          this.selection5.clear(); // Desactivamos todos
          this.inscripcionesAlumnosJuegodeAvatar.forEach (inscripcion => inscripcion.Privilegios[4] = false);
        } else {
          this.datasourceAlumnos.data.forEach(row => this.selection5.select(row));
          this.inscripcionesAlumnosJuegodeAvatar.forEach (inscripcion => inscripcion.Privilegios[4] = true);
        }
      }
      if (n === 6) {
        if (this.IsAllSelected(1)) {
          this.selection6.clear(); // Desactivamos todos
          this.inscripcionesAlumnosJuegodeAvatar.forEach (inscripcion => inscripcion.Privilegios[5] = false);
        } else {
          this.datasourceAlumnos.data.forEach(row => this.selection6.select(row));
          this.inscripcionesAlumnosJuegodeAvatar.forEach (inscripcion => inscripcion.Privilegios[5] = true);
        }
      }
      this.hayCambios = true;
      this.haCambiado.forEach (valor => valor = true);
  }
  HaCambiado(n ,i) {
    // Cuando hago click sobre el privilegio n del alumno i debo cambiar el estado de ese privilegio
    this.inscripcionesAlumnosJuegodeAvatar[i].Privilegios[n - 1] = !this.inscripcionesAlumnosJuegodeAvatar[i].Privilegios[n - 1];
    this.haCambiado[i] = true;
    this.hayCambios = true;
  }

  RegistrarCambios() {
    for (let i = 0; i < this.inscripcionesAlumnosJuegodeAvatar.length; i++) {
      // Solo reflejo los cambios si ha habido cambios
      if (this.haCambiado[i]) {
        this.peticionesAPI.ModificaInscripcionAlumnoJuegoDeAvatar (this.inscripcionesAlumnosJuegodeAvatar[i]).subscribe();
      }
    }
    Swal.fire('Cambios registrados correctamente', ' ', 'success');
  }

  GuardarDatos(alumno: Alumno) {
    // Guardo en la sesión el alumno y su inscripción para que los recoja el componente que mostrará su avatar
    this.sesion.TomaAlumno (alumno);
    // tslint:disable-next-line:max-line-length
    this.sesion.TomaAlumnoJuegoAvatar (this.inscripcionesAlumnosJuegodeAvatar.filter (inscripcion => inscripcion.alumnoId === alumno.id)[0]);
  }



}
