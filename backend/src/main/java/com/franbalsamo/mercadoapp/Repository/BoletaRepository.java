package com.franbalsamo.mercadoapp.Repository;

import com.franbalsamo.mercadoapp.domain.Boleta;
import com.franbalsamo.mercadoapp.domain.Cliente;
import com.franbalsamo.mercadoapp.domain.Planilla;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public interface BoletaRepository extends JpaRepository<Boleta, Long> {
    List<Boleta> findAllByPlanilla(Planilla planilla);
    List<Boleta> findAllByCliente(Cliente cliente);
}
