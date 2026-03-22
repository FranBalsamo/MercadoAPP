package com.franbalsamo.mercadoapp.manager;


import com.franbalsamo.mercadoapp.Enum.EstadoPlanilla;
import com.franbalsamo.mercadoapp.Service.BoletaService;
import com.franbalsamo.mercadoapp.Service.PlanillaService;
import com.franbalsamo.mercadoapp.Service.StockProductoService;
import com.franbalsamo.mercadoapp.domain.Boleta;
import com.franbalsamo.mercadoapp.domain.Planilla;
import com.franbalsamo.mercadoapp.domain.StockProducto;
import com.franbalsamo.mercadoapp.model.PlanillaDTO;
import com.franbalsamo.mercadoapp.model.StockProductoDTO;
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
    public PlanillaDTO closePlanilla(long id_planilla){
        Planilla planilla = planillaService.findById(id_planilla);

        if(EstadoPlanilla.CERRADA.equals(planilla.getEstadoPlanilla())){
            throw new IllegalArgumentException("Esta planilla ya se encuentra cerrada.");
        }

        List<Boleta> boletasDelDia = boletaService.findAllByPlanilla(planilla);

        float sumaIngresos = 0;
        float sumaDeuda = 0;

        for(Boleta boleta: boletasDelDia){
            sumaIngresos += boleta.getTotal();
        }
        /*
            Corregir la logica de calcular la deuda de la planilla total, ya que sacamos el valor de deuda de las boletas!!!
         */
        planilla.setIngresoTotal(sumaIngresos);
        planilla.setDeudaTotal(sumaDeuda);
        planilla.setEstadoPlanilla(EstadoPlanilla.CERRADA);

        return planillaService.updatePlanilla(planilla);
    }
}
