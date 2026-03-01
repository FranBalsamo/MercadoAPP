package com.franbalsamo.mercadoapp.Service;

import com.franbalsamo.mercadoapp.Repository.ProductoRepository;
import com.franbalsamo.mercadoapp.domain.Producto;
import com.franbalsamo.mercadoapp.exception.RecursoNoEncontradoException;
import com.franbalsamo.mercadoapp.model.ProductoDTO;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import tools.jackson.databind.cfg.MapperBuilder;

import java.util.List;
import java.util.Optional;

@Service
public class ProductoService {

    @Autowired
    private ProductoRepository productoRepository;
    @Autowired
    private ModelMapper modelMapper;

    public ProductoDTO saveProducto(ProductoDTO productoDTO){
        Producto productoNuevo = modelMapper.map(productoDTO, Producto.class);
        return modelMapper.map(productoRepository.save(productoNuevo), ProductoDTO.class);
    }

    public ProductoDTO modificarProducto(ProductoDTO productoDTO){
        Producto producto = productoRepository.findById(productoDTO.getId_producto())
                .orElseThrow(() -> new RecursoNoEncontradoException("Producto no encontrado con id: " + productoDTO.getId_producto()));

        producto.setNombre(productoDTO.getNombre());
        producto.setDescripcion(productoDTO.getDescripcion());
        return modelMapper.map(productoRepository.save(producto), ProductoDTO.class);
    }


    public List<ProductoDTO> findAll(){
        return productoRepository.findAll().stream()
                .map(producto -> modelMapper.map(producto, ProductoDTO.class))
                .toList();
    }

    public Producto findById(long id){
        return productoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Producto no encontrado con id: " + id));
    }
    public ProductoDTO findByNombre(String nombre){
        Producto producto = productoRepository.findByNombre(nombre)
                .orElseThrow(() -> new RecursoNoEncontradoException("Producto no encontrado con nombre: " + nombre));
        return modelMapper.map(producto, ProductoDTO.class);
    }



}
