package com.franbalsamo.mercadoapp.modules.sistema.controller;

import org.springframework.beans.factory.annotation.Value;
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

    @Value("${spring.datasource.url}")
    private String datasourceUrl;

    @Value("${spring.datasource.username}")
    private String datasourceUsername;

    // Informacion de solo lectura sobre la base de datos en uso (para mostrar en Configuracion).
    // No expone la contrasenia.
    @GetMapping("/db-info")
    public ResponseEntity<Map<String, String>> obtenerInfoBaseDeDatos() {
        Map<String, String> info = new LinkedHashMap<>();
        info.put("url", datasourceUrl);
        info.put("usuario", datasourceUsername);
        info.put("tipo", "MySQL");
        return new ResponseEntity<>(info, HttpStatus.OK);
    }
}
