package com.franbalsamo.mercadoapp.Repository;

import com.franbalsamo.mercadoapp.domain.Boleta;
import com.franbalsamo.mercadoapp.domain.Cliente;
import com.franbalsamo.mercadoapp.domain.Planilla;
import com.franbalsamo.mercadoapp.model.BoletaDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BoletaRepository extends JpaRepository<Boleta, Long> {
    List<BoletaDTO> findByPlanilla(Planilla planilla);

    List<BoletaDTO> findByCliente(Cliente cliente);
}
