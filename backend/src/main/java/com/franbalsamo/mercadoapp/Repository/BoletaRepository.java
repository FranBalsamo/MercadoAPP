package com.franbalsamo.mercadoapp.Repository;

import com.franbalsamo.mercadoapp.Model.Entity.Boleta;
import com.franbalsamo.mercadoapp.Model.Entity.Cliente;
import com.franbalsamo.mercadoapp.Model.Entity.Planilla;
import com.franbalsamo.mercadoapp.Service.Enum.EstadoPago;
import com.franbalsamo.mercadoapp.Service.Enum.EstadoPlanilla;
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
