package com.franbalsamo.mercadoapp.modules.planilla.repository;

import com.franbalsamo.mercadoapp.modules.planilla.EstadoPlanilla;
import com.franbalsamo.mercadoapp.modules.planilla.model.Planilla;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PlanillaRepository extends JpaRepository<Planilla, Long> {
    List<Planilla> findAllByFechaBetween(LocalDate desde, LocalDate hasta);
    Optional<Planilla> findFirstByEstadoPlanilla(EstadoPlanilla estadoPlanilla);

    // Un solo endpoint paginado para los 2 modos de filtro de VistaPlanillas.jsx (por estado o
    // por rango de fechas): cualquier parametro en null se ignora por completo. Sin filtro de
    // estado, la planilla ABIERTA sigue apareciendo (como hoy con /All), solo que paginada.
    @Query("SELECT p FROM Planilla p WHERE " +
            "(:estado IS NULL OR p.estadoPlanilla = :estado) AND " +
            "(:desde IS NULL OR p.fecha >= :desde) AND " +
            "(:hasta IS NULL OR p.fecha <= :hasta)")
    Page<Planilla> buscarPaginado(
            @Param("estado") EstadoPlanilla estado,
            @Param("desde") LocalDate desde,
            @Param("hasta") LocalDate hasta,
            Pageable pageable);
}
