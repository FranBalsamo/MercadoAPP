package com.franbalsamo.mercadoapp.Controller;

import com.franbalsamo.mercadoapp.Service.BoletaService;
import com.franbalsamo.mercadoapp.domain.Boleta;
import com.franbalsamo.mercadoapp.model.BoletaDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/boleta")
@CrossOrigin(origins = "*")
public class BoletaController {
    @Autowired
    private BoletaService boletaService;

    @PostMapping("/new")
    public ResponseEntity<BoletaDTO> newBoleta (@RequestBody BoletaDTO boletaDTO){
        BoletaDTO boletaNueva = boletaService.newBoleta(boletaDTO);
        return new ResponseEntity<>(boletaNueva, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BoletaDTO> modificarBoleta (@PathVariable long id, @RequestBody BoletaDTO boletaDTO){
        boletaDTO.setId_Boleta(id);
        return new ResponseEntity<>(boletaService.modificarBoleta(boletaDTO), HttpStatus.OK);
    }
}
