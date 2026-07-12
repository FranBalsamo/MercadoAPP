package com.franbalsamo.mercadoapp.modules.venta.repository;

import com.franbalsamo.mercadoapp.modules.venta.model.Venta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface VentaRepository extends JpaRepository<Venta, Long> {

    @Query("SELECT v.producto.id, v.producto.nombre, SUM(v.cantidad) " +
            "FROM Venta v " +
            "WHERE v.boleta.planilla.fecha BETWEEN :desde AND :hasta " +
            "GROUP BY v.producto.id, v.producto.nombre " +
            "ORDER BY SUM(v.cantidad) DESC")
    List<Object[]> findCantidadVendidaPorProducto(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);
}
