package com.franbalsamo.mercadoapp.modules.boleta.model;

import com.franbalsamo.mercadoapp.modules.boleta.FormaPago;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FormaPagoStatDTO {
    private FormaPago formaPago;
    private long cantidad;
    private float porcentaje;

    public FormaPagoStatDTO(){}

    public FormaPagoStatDTO(FormaPago formaPago, long cantidad, float porcentaje){
        this.formaPago = formaPago;
        this.cantidad = cantidad;
        this.porcentaje = porcentaje;
    }
}
