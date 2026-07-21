package com.franbalsamo.mercadoapp.shared.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
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

    // Se dispara cuando dos operaciones concurrentes chocan sobre la misma fila protegida
    // con @Version (stock de producto, saldo del cliente). En vez de un 500 generico, se le
    // pide al usuario que reintente: la otra operacion ya se aplico correctamente.
    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<String> manejarConflictoDeConcurrencia(ObjectOptimisticLockingFailureException ex){
        return new ResponseEntity<>(
                "Otra operacion modifico este mismo registro justo antes. Volve a intentarlo.",
                HttpStatus.CONFLICT);
    }

    // Aquí el día de mañana puedes agregar más métodos para atrapar otras excepciones
    // (ej: si el usuario manda un JSON mal armado, devuelves un 400 BAD_REQUEST)
}