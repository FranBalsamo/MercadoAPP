package com.franbalsamo.mercadoapp.Controller;

import com.franbalsamo.mercadoapp.Service.ClienteService;
import com.franbalsamo.mercadoapp.Service.ProductoService;
import com.franbalsamo.mercadoapp.domain.Producto;
import com.franbalsamo.mercadoapp.model.ProductoDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/productos")
@CrossOrigin(origins = "*")//@CrossOrigin es crucial para que el frontend se conecte sin bloqueos!
public class ProductoController {

    @Autowired
    private ProductoService productoService;


    @PostMapping
    public ResponseEntity<ProductoDTO> newProducto(@RequestBody ProductoDTO productoDTO){
        ProductoDTO productoNuevo = productoService.saveProducto(productoDTO);
        return new ResponseEntity<>(productoNuevo, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductoDTO> modificarProducto(@PathVariable Long id, @RequestBody ProductoDTO productoDTO){
        productoDTO.setId_producto(id);
        ProductoDTO productoActualizado = productoService.modificarProducto(productoDTO);
        return new ResponseEntity<>(productoActualizado, HttpStatus.OK);
    }

    @GetMapping
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
