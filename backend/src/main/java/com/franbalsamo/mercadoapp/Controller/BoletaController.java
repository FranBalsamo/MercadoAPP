package com.franbalsamo.mercadoapp.Controller;

import com.franbalsamo.mercadoapp.Service.BoletaService;
import com.franbalsamo.mercadoapp.Model.DTO.BoletaDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @PutMapping("/edit/{id}")
    public ResponseEntity<BoletaDTO> modificarBoleta (@PathVariable long id, @RequestBody BoletaDTO boletaDTO){
        boletaDTO.setId(id);
        return new ResponseEntity<>(boletaService.modificarBoleta(boletaDTO), HttpStatus.OK);
    }

    @GetMapping("/planilla/{id}")
    public ResponseEntity<List<BoletaDTO>> findAllByPlanilla(@PathVariable long id){
        return new ResponseEntity<>(boletaService.findAllByPlanilla(id), HttpStatus.OK);
    }

    @GetMapping("/cliente/{id}")
    public ResponseEntity<List<BoletaDTO>> findAllByCliente(@PathVariable long id){
        return new ResponseEntity<>(boletaService.findByCliente(id), HttpStatus.OK);
    }

    @DeleteMapping("/remove/{id}")
    public ResponseEntity<Void> removeBoleta(@PathVariable long id){
        boletaService.removeBoleta(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT); // 204 No Content (no tiene contenido de retorno)
    }
}
