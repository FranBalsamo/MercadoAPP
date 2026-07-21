package com.franbalsamo.mercadoapp.modules.planilla.controller;

import com.franbalsamo.mercadoapp.modules.planilla.service.CajaManager;
import com.franbalsamo.mercadoapp.modules.planilla.service.PlanillaService;
import com.franbalsamo.mercadoapp.modules.planilla.model.PlanillaDTO;
import com.franbalsamo.mercadoapp.modules.planilla.EstadoPlanilla;
import com.franbalsamo.mercadoapp.modules.stockproducto.model.StockProductoDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
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

    @GetMapping("/All")
    public ResponseEntity<List<PlanillaDTO>> findAll(){
        List<PlanillaDTO> listaPlanillas = planillaService.findAll();
        return new ResponseEntity<>(listaPlanillas, HttpStatus.OK);
    }

    // Filtra (opcionalmente por estado y/o rango de fechas) + pagina en el servidor, a
    // diferencia de /All (que VistaPlanillas usa hoy trayendo TODO el historico para despues
    // filtrar/ordenar en el cliente).
    @GetMapping("/buscar/paginado")
    public ResponseEntity<Page<PlanillaDTO>> buscarPaginado(
            @RequestParam(required = false) EstadoPlanilla estado,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size){
        Pageable pageable = PageRequest.of(page, size, Sort.by("fecha").descending());
        return new ResponseEntity<>(planillaService.buscarPaginado(estado, desde, hasta, pageable), HttpStatus.OK);
    }

    @GetMapping("/abierta")
    public ResponseEntity<PlanillaDTO> findAbierta(){
        return planillaService.findAbierta()
                .map(planillaDTO -> new ResponseEntity<>(planillaDTO, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NO_CONTENT));
    }

    @GetMapping("/rango")
    public ResponseEntity<List<PlanillaDTO>> findAllByRangoFechas(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta){
        return new ResponseEntity<>(planillaService.findAllByRangoFechas(desde, hasta), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlanillaDTO> findById(@PathVariable long id){
        return new ResponseEntity<>(planillaService.findDTOById(id), HttpStatus.OK);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id){
        planillaService.delete(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
