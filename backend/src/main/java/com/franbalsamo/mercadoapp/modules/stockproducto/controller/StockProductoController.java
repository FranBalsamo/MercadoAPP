package com.franbalsamo.mercadoapp.modules.stockproducto.controller;

import com.franbalsamo.mercadoapp.modules.stockproducto.service.StockProductoService;
import com.franbalsamo.mercadoapp.modules.stockproducto.model.StockProductoDTO;
import com.franbalsamo.mercadoapp.modules.stockproducto.model.ProductoStockCriticoDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stock")
@CrossOrigin(origins = "*")
public class StockProductoController {

    @Autowired
    private StockProductoService stockProductoService;


    @PostMapping("/add")
    public ResponseEntity<StockProductoDTO> newStock(@RequestBody StockProductoDTO stockProductoDTONuevo){
        StockProductoDTO stockProductoActualizado = stockProductoService.addStock(stockProductoDTONuevo);
        return new ResponseEntity<>(stockProductoActualizado, HttpStatus.OK);
    }

    @PutMapping("/update")
    public ResponseEntity<List<StockProductoDTO>> editStocks(@RequestBody List<StockProductoDTO> listaStockProductosDTO){
        List<StockProductoDTO> listaStockProductoDTOActualizados = stockProductoService.updateStocks(listaStockProductosDTO);
        return new ResponseEntity<>(listaStockProductoDTOActualizados, HttpStatus.OK);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteStock(@PathVariable long id){
        stockProductoService.delete(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @GetMapping("/estadisticas/stock-critico")
    public ResponseEntity<List<ProductoStockCriticoDTO>> findProductosStockCriticoRecurrente(
            @RequestParam(defaultValue = "6") int limite){
        return new ResponseEntity<>(stockProductoService.findProductosStockCriticoRecurrente(limite), HttpStatus.OK);
    }
}
