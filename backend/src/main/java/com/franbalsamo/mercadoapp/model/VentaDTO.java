package com.franbalsamo.mercadoapp.model;

import com.franbalsamo.mercadoapp.Enum.EstadoEntrega;
import com.franbalsamo.mercadoapp.Enum.EstadoPago;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VentaDTO {
    private long id_boleta;
    private long id_producto;
    private int cantidad;
    private float precio_unitario;
    private EstadoPago estadoPago;
    private EstadoEntrega estadoEntrega;
}
