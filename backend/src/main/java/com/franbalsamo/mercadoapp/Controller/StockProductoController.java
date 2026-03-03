package com.franbalsamo.mercadoapp.Controller;

import com.franbalsamo.mercadoapp.Service.StockProductoService;
import com.franbalsamo.mercadoapp.model.StockProductoDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stock")
@CrossOrigin(origins = "*")
public class StockProductoController {

    @Autowired
    private StockProductoService stockProductoService;

    @PutMapping("/add")
    public ResponseEntity<StockProductoDTO> addStock(@RequestBody StockProductoDTO stockProductoDTO,
                                                     @RequestParam int cantidadAjuste){
        StockProductoDTO stockProductoActualizado = stockProductoService.addStock(stockProductoDTO, cantidadAjuste);
        return new ResponseEntity<>(stockProductoActualizado, HttpStatus.OK);
    }

    @PutMapping("/remove")
    public ResponseEntity<StockProductoDTO> removeStock(@RequestBody StockProductoDTO stockProductoDTO,
                                                     @RequestParam int cantidadAjuste){
        StockProductoDTO stockProductoActualizado = stockProductoService.removeStock(stockProductoDTO, cantidadAjuste);
        return new ResponseEntity<>(stockProductoActualizado, HttpStatus.OK);
    }
}
