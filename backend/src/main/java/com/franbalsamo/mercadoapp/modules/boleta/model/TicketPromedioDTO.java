package com.franbalsamo.mercadoapp.modules.boleta.model;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TicketPromedioDTO {
    private long cantidadBoletas;
    private float totalFacturado;
    private float promedio;

    public TicketPromedioDTO(){}

    public TicketPromedioDTO(long cantidadBoletas, float totalFacturado, float promedio){
        this.cantidadBoletas = cantidadBoletas;
        this.totalFacturado = totalFacturado;
        this.promedio = promedio;
    }
}
