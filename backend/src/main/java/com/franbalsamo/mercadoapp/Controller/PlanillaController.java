package com.franbalsamo.mercadoapp.Controller;

import com.franbalsamo.mercadoapp.Service.manager.CajaManager;
import com.franbalsamo.mercadoapp.Service.PlanillaService;
import com.franbalsamo.mercadoapp.Model.DTO.PlanillaDTO;
import com.franbalsamo.mercadoapp.Model.DTO.StockProductoDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/planilla")
@CrossOrigin(origins = "*")
public class PlanillaController {

    @Autowired
    public PlanillaService planillaService;

    @Autowired
    public CajaManager cajaManager;

    @PostMapping("/new")
    public ResponseEntity<PlanillaDTO> newPlanilla(@RequestBody PlanillaDTO planillaDTO){
       PlanillaDTO planillaDTONueva = planillaService.newPlanilla(planillaDTO);
       return new ResponseEntity<>(planillaDTONueva, HttpStatus.CREATED);
    }

    @PutMapping("/close/{id}")
    public ResponseEntity<PlanillaDTO> closePlanilla(@PathVariable long id){
        PlanillaDTO planillaCerrada = cajaManager.closePlanilla(id);
        return new ResponseEntity<>(planillaCerrada, HttpStatus.OK);
    }

    @GetMapping("/stocks/{id_planilla}")
    public ResponseEntity<List<StockProductoDTO>> findAllByPlanilla(@PathVariable long id_planilla){
        List<StockProductoDTO> listaStock = planillaService.getStockProductos(id_planilla);
        return new ResponseEntity<>(listaStock, HttpStatus.OK);
    }
}
