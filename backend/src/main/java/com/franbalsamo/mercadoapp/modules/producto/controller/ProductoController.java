package com.franbalsamo.mercadoapp.modules.producto.controller;

import com.franbalsamo.mercadoapp.modules.producto.service.ProductoService;
import com.franbalsamo.mercadoapp.modules.producto.model.ProductoDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/productos")
@CrossOrigin(origins = "*")//@CrossOrigin es crucial para que el frontend se conecte sin bloqueos!
public class ProductoController {

    @Autowired
    private ProductoService productoService;


    @PostMapping("/new")
    public ResponseEntity<ProductoDTO> newProducto(@RequestBody ProductoDTO productoDTO){

        if(productoService.existsByNombre(productoDTO.getNombre())){
            return new ResponseEntity<>(HttpStatus.CONFLICT);
        }

        ProductoDTO productoNuevo = productoService.saveProducto(productoDTO);
        return new ResponseEntity<>(productoNuevo, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductoDTO> modificarProducto(@PathVariable Long id, @RequestBody ProductoDTO productoDTO){
        productoDTO.setId(id);
        ProductoDTO productoActualizado = productoService.modificarProducto(productoDTO);
        return new ResponseEntity<>(productoActualizado, HttpStatus.OK);
    }

    @GetMapping("/All")
    public ResponseEntity<List<ProductoDTO>> findAll(){
        List<ProductoDTO> listaPorductos = productoService.findAll();
        return new ResponseEntity<>(listaPorductos,HttpStatus.OK);
    }

    @GetMapping("/nombre/{nombre}")
    public ResponseEntity<ProductoDTO> findByNombre(@PathVariable String nombre) {
        ProductoDTO productoEncontrado = productoService.findByNombre(nombre);
        return new ResponseEntity<>(productoEncontrado, HttpStatus.OK);
    }
}
