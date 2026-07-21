package com.franbalsamo.mercadoapp.modules.producto.service;

import com.franbalsamo.mercadoapp.modules.producto.repository.ProductoRepository;
import com.franbalsamo.mercadoapp.modules.producto.model.Producto;
import com.franbalsamo.mercadoapp.shared.exception.RecursoNoEncontradoException;
import com.franbalsamo.mercadoapp.shared.exception.ReglaNegocioException;
import com.franbalsamo.mercadoapp.modules.producto.model.ProductoDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductoService {

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private ProductoMapper productoMapper;

    // Producto.normalizarDatos() (@PrePersist/@PreUpdate) guarda 'nombre' siempre en
    // trim+minuscula; se normaliza aca tambien para que las busquedas/chequeos de duplicado
    // (que reciben el texto tal cual lo escribio el usuario) comparen contra el mismo formato.
    private String normalizar(String texto){
        return texto == null ? null : texto.trim().toLowerCase();
    }

    private void validarNombre(ProductoDTO productoDTO){
        if(productoDTO.getNombre() == null || productoDTO.getNombre().isBlank()){
            throw new ReglaNegocioException("El nombre del producto es obligatorio.");
        }
    }

    public ProductoDTO saveProducto(ProductoDTO productoDTO){
        validarNombre(productoDTO);
        Producto productoNuevo = productoMapper.toEntity(productoDTO);
        return productoMapper.toDTO(productoRepository.save(productoNuevo));
    }

    public ProductoDTO modificarProducto(ProductoDTO productoDTO){
        validarNombre(productoDTO);

        Producto producto = productoRepository.findById(productoDTO.getId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Producto no encontrado con id: " + productoDTO.getId()));

        String nombreNormalizado = normalizar(productoDTO.getNombre());

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

    public Page<ProductoDTO> buscarPaginado(String nombre, Pageable pageable){
        return productoRepository.buscarPaginado(normalizar(nombre), pageable)
                .map(productoMapper::toDTO);
    }

    public Producto findById(long id){
        return productoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Producto no encontrado con id: " + id));
    }
    public ProductoDTO findByNombre(String nombre){
        Producto producto = productoRepository.findByNombre(normalizar(nombre))
                .orElseThrow(() -> new RecursoNoEncontradoException("Producto no encontrado con nombre: " + nombre));
        return productoMapper.toDTO(producto);
    }

    public boolean existsByNombre(String nombre){
        return productoRepository.existsByNombre(normalizar(nombre));
    }
}
