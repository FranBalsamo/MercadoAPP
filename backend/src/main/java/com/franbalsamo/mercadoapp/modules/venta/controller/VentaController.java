package com.franbalsamo.mercadoapp.modules.venta.controller;

import com.franbalsamo.mercadoapp.modules.venta.model.ProductoVendidoDTO;
import com.franbalsamo.mercadoapp.modules.venta.service.VentaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/venta")
@CrossOrigin(origins = "*")
public class VentaController {

    @Autowired
    private VentaService ventaService;

    @GetMapping("/top-productos")
    public ResponseEntity<List<ProductoVendidoDTO>> findTopProductosVendidos(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(defaultValue = "6") int limite){
        return new ResponseEntity<>(ventaService.findTopProductosVendidos(desde, hasta, limite), HttpStatus.OK);
    }
}
