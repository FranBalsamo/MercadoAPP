package com.franbalsamo.mercadoapp.Controller;

import com.franbalsamo.mercadoapp.Service.PlanillaService;
import com.franbalsamo.mercadoapp.domain.Planilla;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/planilla")
@CrossOrigin(origins = "*")
public class PlanillaController {

    @Autowired
    public PlanillaService planillaService;

    @PostMapping("/new")
    public ResponseEntity<Planilla> newPlanilla(){
       Planilla planillaNueva = planillaService.newPlanilla();
       return new ResponseEntity<>(planillaNueva, HttpStatus.CREATED);
    }
}
