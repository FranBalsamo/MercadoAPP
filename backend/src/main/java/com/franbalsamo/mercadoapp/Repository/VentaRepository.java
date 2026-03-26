package com.franbalsamo.mercadoapp.Repository;

import com.franbalsamo.mercadoapp.Model.Entity.Venta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VentaRepository extends JpaRepository<Venta, Long> {
}
