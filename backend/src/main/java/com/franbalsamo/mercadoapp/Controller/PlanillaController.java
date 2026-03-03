package com.franbalsamo.mercadoapp.Controller;

import com.franbalsamo.mercadoapp.Service.PlanillaService;
import com.franbalsamo.mercadoapp.domain.Planilla;
import com.franbalsamo.mercadoapp.model.PlanillaDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/planilla")
@CrossOrigin(origins = "*")
public class PlanillaController {

    @Autowired
    public PlanillaService planillaService;

    @PostMapping("/new")
    public ResponseEntity<PlanillaDTO> newPlanilla(@RequestBody PlanillaDTO planillaDTO){
       PlanillaDTO planillaDTONueva = planillaService.newPlanilla(planillaDTO);
       return new ResponseEntity<>(planillaDTONueva, HttpStatus.CREATED);
    }
}
