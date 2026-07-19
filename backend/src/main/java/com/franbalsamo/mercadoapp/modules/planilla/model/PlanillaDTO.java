package com.franbalsamo.mercadoapp.modules.planilla.model;

import com.franbalsamo.mercadoapp.modules.planilla.EstadoPlanilla;
import com.franbalsamo.mercadoapp.modules.stockproducto.model.StockProductoDTO;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class PlanillaDTO {
    private long id;
    private LocalDate fecha;
    private float ingresoTotal;
    private float deudaTotal;
    private EstadoPlanilla estadoPlanilla;
    private List<StockProductoDTO> stockProductos;
    public PlanillaDTO(){}
}
