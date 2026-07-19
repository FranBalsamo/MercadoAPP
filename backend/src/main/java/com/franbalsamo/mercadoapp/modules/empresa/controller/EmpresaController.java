package com.franbalsamo.mercadoapp.modules.empresa.controller;

import com.franbalsamo.mercadoapp.modules.empresa.model.EmpresaDTO;
import com.franbalsamo.mercadoapp.modules.empresa.service.EmpresaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/empresa")
@CrossOrigin(origins = "*")
public class EmpresaController {

    @Autowired
    private EmpresaService empresaService;

    @GetMapping
    public ResponseEntity<EmpresaDTO> obtenerEmpresa() {
        return new ResponseEntity<>(empresaService.getEmpresa(), HttpStatus.OK);
    }

    @PutMapping("/edit")
    public ResponseEntity<EmpresaDTO> actualizarEmpresa(@RequestBody EmpresaDTO empresaDTO) {
        return new ResponseEntity<>(empresaService.actualizarEmpresa(empresaDTO), HttpStatus.OK);
    }
}
