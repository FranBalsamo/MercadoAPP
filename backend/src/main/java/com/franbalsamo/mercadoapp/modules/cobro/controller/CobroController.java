package com.franbalsamo.mercadoapp.modules.cobro.controller;

import com.franbalsamo.mercadoapp.modules.cobro.model.CobroDTO;
import com.franbalsamo.mercadoapp.modules.cobro.service.CobroService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/cobro")
@CrossOrigin(origins = "*")
public class CobroController {

    @Autowired
    private CobroService cobroService;

    @GetMapping("/cliente/{id}")
    public ResponseEntity<List<CobroDTO>> findAllByCliente(@PathVariable long id) {
        return new ResponseEntity<>(cobroService.findAllByCliente(id), HttpStatus.OK);
    }

    @GetMapping("/buscar/fecha")
    public ResponseEntity<List<CobroDTO>> findAllByRangoFechas(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return new ResponseEntity<>(cobroService.findAllByRangoFechas(desde, hasta), HttpStatus.OK);
    }
}
