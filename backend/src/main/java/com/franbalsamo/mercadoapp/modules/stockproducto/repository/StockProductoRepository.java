package com.franbalsamo.mercadoapp.modules.stockproducto.repository;

import com.franbalsamo.mercadoapp.modules.planilla.model.Planilla;
import com.franbalsamo.mercadoapp.modules.planilla.EstadoPlanilla;
import com.franbalsamo.mercadoapp.modules.producto.model.Producto;
import com.franbalsamo.mercadoapp.modules.stockproducto.model.StockProducto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StockProductoRepository extends JpaRepository<StockProducto, Long> {
    Optional<StockProducto> findByProductoAndPlanilla(Producto producto, Planilla planilla);
    Optional<StockProducto> findByProductoIdAndPlanillaId(Long productoId, Long planillaId);

    @Query("SELECT sp.producto.id, sp.producto.nombre, COUNT(sp) FROM StockProducto sp " +
            "WHERE sp.planilla.estadoPlanilla = :estadoPlanilla " +
            "AND (sp.stock - sp.stock_vendido) <= 0 " +
            "GROUP BY sp.producto.id, sp.producto.nombre " +
            "ORDER BY COUNT(sp) DESC")
    List<Object[]> findProductosStockCriticoRecurrente(@Param("estadoPlanilla") EstadoPlanilla estadoPlanilla);
}
