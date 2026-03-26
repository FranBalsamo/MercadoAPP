package com.franbalsamo.mercadoapp.Model.DTO;

import com.franbalsamo.mercadoapp.Service.Enum.EstadoPlanilla;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class PlanillaDTO {
    private long id;
    private LocalDate fecha;
    private float IngresoTotal;
    private float deudaTotal;
    private EstadoPlanilla estadoPlanilla;
    private List<StockProductoDTO> stockProductos;
    public PlanillaDTO(){}
}
