package com.franbalsamo.mercadoapp.modules.producto.service;

import com.franbalsamo.mercadoapp.modules.producto.repository.ProductoRepository;
import com.franbalsamo.mercadoapp.modules.producto.model.Producto;
import com.franbalsamo.mercadoapp.shared.exception.RecursoNoEncontradoException;
import com.franbalsamo.mercadoapp.shared.exception.ReglaNegocioException;
import com.franbalsamo.mercadoapp.modules.producto.model.ProductoDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

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

        String nombreNormalizado = productoDTO.getNombre().trim().toLowerCase();

        if(!producto.getNombre().equalsIgnoreCase(nombreNormalizado) && productoRepository.existsByNombre(nombreNormalizado)){
            throw new ReglaNegocioException("Ya existe un producto con el nombre: " + productoDTO.getNombre().trim());
        }

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
