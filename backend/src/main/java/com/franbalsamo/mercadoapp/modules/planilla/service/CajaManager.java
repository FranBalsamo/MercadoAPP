package com.franbalsamo.mercadoapp.modules.planilla.service;

import com.franbalsamo.mercadoapp.modules.boleta.EstadoPago;
import com.franbalsamo.mercadoapp.modules.planilla.EstadoPlanilla;
import com.franbalsamo.mercadoapp.modules.boleta.service.BoletaService;
import com.franbalsamo.mercadoapp.modules.boleta.model.Boleta;
import com.franbalsamo.mercadoapp.modules.planilla.model.Planilla;
import com.franbalsamo.mercadoapp.modules.planilla.model.PlanillaDTO;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CajaManager {

    @Autowired
    private PlanillaService planillaService;

    @Autowired
    private BoletaService boletaService;

    @Transactional
    public PlanillaDTO closePlanilla(long id_planilla) {
        Planilla planilla = planillaService.findById(id_planilla);

        if (EstadoPlanilla.CERRADA.equals(planilla.getEstadoPlanilla())) {
            throw new IllegalArgumentException("Esta planilla ya se encuentra cerrada.");
        }

        List<Boleta> boletasDelDia = boletaService.findAllByPlanilla(planilla);

        float sumaIngresos = 0;
        float sumaDeuda = 0;

        for (Boleta boleta : boletasDelDia) {
            if (boleta.getEstadoPago() == EstadoPago.PAGADO) {
                sumaIngresos += boleta.getTotal();
            } else {
                sumaDeuda += boleta.getTotal();
            }
        }
        planilla.setIngresoTotal(sumaIngresos);
        planilla.setDeudaTotal(sumaDeuda);
        planilla.setEstadoPlanilla(EstadoPlanilla.CERRADA);

        return planillaService.updatePlanilla(planilla);
    }
}
