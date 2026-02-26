package com.franbalsamo.mercadoapp.Service;

import com.franbalsamo.mercadoapp.Repository.ProductoRepository;
import com.franbalsamo.mercadoapp.domain.Producto;
import com.franbalsamo.mercadoapp.model.ProductoDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProductoService {

    @Autowired
    private ProductoRepository productoRepository;

    public Producto saveProducto(ProductoDTO productoDTO){
        Producto productoNuevo = new Producto(productoDTO.getNombre());
        return productoRepository.save(productoNuevo);
    }

    public List<Producto> findAll(){ return productoRepository.findAll(); }

    public Producto findByNombre(String nombre){
        return productoRepository.findByNombre(nombre).orElse(null);
    }



}
