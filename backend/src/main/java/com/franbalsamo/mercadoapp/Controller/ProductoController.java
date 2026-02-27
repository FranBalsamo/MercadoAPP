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
    public ResponseEntity<Producto> newProducto(@RequestBody ProductoDTO productoDTO){
        Producto productoNuevo = productoService.saveProducto(productoDTO);
        return new ResponseEntity<>(productoNuevo, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Producto>> findAll(){
        List<Producto> listaPorductos = productoService.findAll();
        return new ResponseEntity<>(listaPorductos,HttpStatus.OK);
    }

    @GetMapping("/nombre/{nombre}")
    public ResponseEntity<Producto> findByNombre(@PathVariable String nombre) {
        Producto productoEncontrado = productoService.findByNombre(nombre);
        if (productoEncontrado != null) {
            return new ResponseEntity<>(productoEncontrado, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }
}
