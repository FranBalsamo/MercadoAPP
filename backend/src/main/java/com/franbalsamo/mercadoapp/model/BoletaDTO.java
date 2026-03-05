package com.franbalsamo.mercadoapp.model;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class BoletaDTO {
    private long id_boleta;
    private long id_planilla;
    private long id_cliente;
    private List<VentaDTO> ventas;
    private float total;
    private float deuda;

    public BoletaDTO(){}
}

