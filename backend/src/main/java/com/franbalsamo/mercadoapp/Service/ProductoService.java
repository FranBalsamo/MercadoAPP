package com.franbalsamo.mercadoapp.Service;

import com.franbalsamo.mercadoapp.Repository.ProductoRepository;
import com.franbalsamo.mercadoapp.domain.Producto;
import com.franbalsamo.mercadoapp.exception.RecursoNoEncontradoException;
import com.franbalsamo.mercadoapp.mapper.ProductoMapper;
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
    private ProductoMapper productoMapper;

    public ProductoDTO saveProducto(ProductoDTO productoDTO){
        Producto productoNuevo = productoMapper.toEntity(productoDTO);
        return productoMapper.toDTO(productoRepository.save(productoNuevo));
    }

    public ProductoDTO modificarProducto(ProductoDTO productoDTO){
        Producto producto = productoRepository.findById(productoDTO.getId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Producto no encontrado con id: " + productoDTO.getId()));

        producto.setNombre(productoDTO.getNombre());
        producto.setDescripcion(productoDTO.getDescripcion());
        return productoMapper.toDTO(productoRepository.save(producto));
    }


    public List<ProductoDTO> findAll(){
        return productoRepository.findAll().stream()
                .map(productoMapper::toDTO)
                .toList();
    }

    public Producto findById(long id){
        return productoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Producto no encontrado con id: " + id));
    }
    public ProductoDTO findByNombre(String nombre){
        Producto producto = productoRepository.findByNombre(nombre)
                .orElseThrow(() -> new RecursoNoEncontradoException("Producto no encontrado con nombre: " + nombre));
        return productoMapper.toDTO(producto);
    }

    public boolean existsByNombre(String nombre){
        return productoRepository.existsByNombre(nombre);
    }
}
