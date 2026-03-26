package com.franbalsamo.mercadoapp.Repository;

import com.franbalsamo.mercadoapp.Model.Entity.Planilla;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlanillaRepository extends JpaRepository<Planilla, Long> {
}
