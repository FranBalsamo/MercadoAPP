package com.franbalsamo.mercadoapp.modules.planilla.repository;

import com.franbalsamo.mercadoapp.modules.planilla.model.Planilla;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlanillaRepository extends JpaRepository<Planilla, Long> {
}
