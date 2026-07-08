package com.franbalsamo.mercadoapp.modules.stockproducto.repository;

import com.franbalsamo.mercadoapp.modules.planilla.model.Planilla;
import com.franbalsamo.mercadoapp.modules.producto.model.Producto;
import com.franbalsamo.mercadoapp.modules.stockproducto.model.StockProducto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StockProductoRepository extends JpaRepository<StockProducto, Long> {
    Optional<StockProducto> findByProductoAndPlanilla(Producto producto, Planilla planilla);
    Optional<StockProducto> findByProductoIdAndPlanillaId(Long productoId, Long planillaId);
}
