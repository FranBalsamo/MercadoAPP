package com.franbalsamo.mercadoapp.modules.cobro.repository;

import com.franbalsamo.mercadoapp.modules.cliente.model.Cliente;
import com.franbalsamo.mercadoapp.modules.cobro.model.Cobro;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CobroRepository extends JpaRepository<Cobro, Long> {
    List<Cobro> findAllByClienteOrderByFechaDesc(Cliente cliente);
    Page<Cobro> findAllByClienteOrderByFechaDesc(Cliente cliente, Pageable pageable);
    List<Cobro> findAllByFechaBetweenOrderByFechaDesc(LocalDate desde, LocalDate hasta);
    Page<Cobro> findAllByFechaBetweenOrderByFechaDesc(LocalDate desde, LocalDate hasta, Pageable pageable);
}
