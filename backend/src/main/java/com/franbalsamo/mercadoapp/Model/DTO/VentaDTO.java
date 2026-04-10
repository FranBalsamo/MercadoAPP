package com.franbalsamo.mercadoapp.Model.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VentaDTO {
    private long id;
    private long id_boleta;
    private long id_producto;
    private float cantidad;
    private float precio_unitario;
    private float precio_vacio;

    public VentaDTO(){}
}
