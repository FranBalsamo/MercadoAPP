package com.franbalsamo.mercadoapp.modules.producto.repository;

import com.franbalsamo.mercadoapp.modules.producto.model.Producto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {
    Optional<Producto> findByNombre(String nombre);

    boolean existsByNombre(String nombre);

    @Query("SELECT p FROM Producto p WHERE :nombre IS NULL OR p.nombre LIKE LOWER(CONCAT('%', :nombre, '%'))")
    Page<Producto> buscarPaginado(@Param("nombre") String nombre, Pageable pageable);
}
