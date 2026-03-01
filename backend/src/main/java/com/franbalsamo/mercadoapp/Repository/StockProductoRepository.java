package com.franbalsamo.mercadoapp.Repository;

import com.franbalsamo.mercadoapp.domain.Planilla;
import com.franbalsamo.mercadoapp.domain.Producto;
import com.franbalsamo.mercadoapp.domain.StockProducto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StockProductoRepository extends JpaRepository<StockProducto, Long> {
    Optional<StockProducto> findByProductoAndPlanilla(Producto producto, Planilla planilla);
}
