package com.franbalsamo.mercadoapp.model;

import com.franbalsamo.mercadoapp.Enum.EstadoPlanilla;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class PlanillaDTO {
    private long id_planilla;
    private LocalDate fecha;
    private float gananciasTotal;
    private float deudaTotal;
    private EstadoPlanilla estadoPlanilla;
    private List<StockProductoDTO> stockProductos;
    public PlanillaDTO(){}
}
