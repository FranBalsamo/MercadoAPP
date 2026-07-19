package com.franbalsamo.mercadoapp.modules.planilla.repository;

import com.franbalsamo.mercadoapp.modules.planilla.EstadoPlanilla;
import com.franbalsamo.mercadoapp.modules.planilla.model.Planilla;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PlanillaRepository extends JpaRepository<Planilla, Long> {
    List<Planilla> findAllByFechaBetween(LocalDate desde, LocalDate hasta);
    Optional<Planilla> findFirstByEstadoPlanilla(EstadoPlanilla estadoPlanilla);
}
