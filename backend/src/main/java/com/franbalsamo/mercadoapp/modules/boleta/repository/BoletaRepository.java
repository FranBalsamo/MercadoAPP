package com.franbalsamo.mercadoapp.modules.boleta.repository;

import com.franbalsamo.mercadoapp.modules.boleta.model.Boleta;
import com.franbalsamo.mercadoapp.modules.cliente.model.Cliente;
import com.franbalsamo.mercadoapp.modules.planilla.model.Planilla;
import com.franbalsamo.mercadoapp.modules.boleta.EstadoPago;
import com.franbalsamo.mercadoapp.modules.planilla.EstadoPlanilla;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public interface BoletaRepository extends JpaRepository<Boleta, Long> {
    List<Boleta> findAllByPlanilla(Planilla planilla);
    List<Boleta> findAllByCliente(Cliente cliente);
    List<Boleta> findAllByEstadoPagoAndPlanilla_EstadoPlanilla(
            EstadoPago estadoPago
            ,EstadoPlanilla estadoPlanilla);
    List<Boleta> findAllByClienteAndEstadoPagoAndPlanilla_EstadoPlanilla(
            Cliente cliente,
            EstadoPago estadoPago,
            EstadoPlanilla planillaEstadoPlanilla);

}
