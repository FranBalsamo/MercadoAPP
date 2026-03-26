package com.franbalsamo.mercadoapp.Service.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RecursoNoEncontradoException.class)
    public ResponseEntity<String> manejarRecursoNoEncontrado(RecursoNoEncontradoException ex) {
        // Devuelve el mensaje de tu excepción ("Cliente no encontrado...") y el código 404
        return new ResponseEntity<>(ex.getMessage(), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(ReglaNegocioException.class)
    public ResponseEntity<String> manejarReglaNegocio(ReglaNegocioException ex){
        return new ResponseEntity<>(ex.getMessage(), HttpStatus.BAD_REQUEST);
    }


    // Aquí el día de mañana puedes agregar más métodos para atrapar otras excepciones
    // (ej: si el usuario manda un JSON mal armado, devuelves un 400 BAD_REQUEST)
}