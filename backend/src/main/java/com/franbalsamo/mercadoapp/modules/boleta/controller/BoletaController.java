package com.franbalsamo.mercadoapp.modules.boleta.controller;

import com.franbalsamo.mercadoapp.modules.boleta.service.BoletaService;
import com.franbalsamo.mercadoapp.modules.boleta.model.BoletaDTO;
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

    @GetMapping("/cliente/{id_cliente}/deudas")
    public ResponseEntity<List<BoletaDTO>> findAllDeudasByCliente(@PathVariable long id_cliente){
        return new ResponseEntity<>(boletaService.findAllDeudasByCliente(id_cliente), HttpStatus.OK);
    }

    @PutMapping("/cobrar_deuda/{listaIds_boletas}/cliente/{id_cliente}")
    public ResponseEntity<List<BoletaDTO>> cobrarBoletasDeudasSeleccionadas(
            @PathVariable List<Long> listaIds_boletas ,@PathVariable long id_cliente ){
      return new ResponseEntity<>(boletaService.cobrarBoletasDeudasSeleccionadas(listaIds_boletas, id_cliente), HttpStatus.OK);
    }

    @PutMapping("/cobrar_deuda/cliente/{id_cliente}/monto/{monto_pago}")
    public ResponseEntity<List<BoletaDTO>> cobrarBoletasDeudasPagoACuenta(
            @PathVariable long id_cliente ,@PathVariable float monto_pago ){
        return new ResponseEntity<>(boletaService.cobrarBoletasDeudasPagoACuenta(id_cliente,monto_pago),HttpStatus.OK);
    }
    @DeleteMapping("/remove/{id}")
    public ResponseEntity<Void> removeBoleta(@PathVariable long id){
        boletaService.removeBoleta(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
