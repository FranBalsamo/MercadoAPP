package com.franbalsamo.mercadoapp.modules.sistema.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/sistema")
@CrossOrigin(origins = "*")
public class SistemaController {

    // Informacion de solo lectura sobre la base de datos en uso (para mostrar en Configuracion).
    // No devuelve el host/puerto/usuario reales: como este endpoint no tiene autenticacion (ni
    // la tiene ningun otro de la app), exponer esos datos facilita adivinar la contrasenia por
    // defecto de MySQL a cualquiera que llegue al puerto del backend.
    @GetMapping("/db-info")
    public ResponseEntity<Map<String, String>> obtenerInfoBaseDeDatos() {
        Map<String, String> info = new LinkedHashMap<>();
        info.put("tipo", "MySQL");
        info.put("estado", "Conectada");
        return new ResponseEntity<>(info, HttpStatus.OK);
    }
}
