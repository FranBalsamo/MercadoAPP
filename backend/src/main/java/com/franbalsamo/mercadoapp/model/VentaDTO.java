package com.franbalsamo.mercadoapp.model;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VentaDTO {
    private long id;
    private long id_boleta;
    private long id_producto;
    private int cantidad;
    private float precio_unitario;
    private float precio_vacio;

    public VentaDTO(){}
}
