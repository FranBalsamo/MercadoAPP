package com.franbalsamo.mercadoapp.modules.venta.repository;

import com.franbalsamo.mercadoapp.modules.venta.model.Venta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VentaRepository extends JpaRepository<Venta, Long> {
}
