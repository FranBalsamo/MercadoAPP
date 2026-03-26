package com.franbalsamo.mercadoapp.Model.DTO;

import com.franbalsamo.mercadoapp.Service.Enum.EstadoPago;
import com.franbalsamo.mercadoapp.Service.Enum.EstadoRetiro;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class BoletaDTO {
    private long id;
    private long id_planilla;
    private long id_cliente;
    private float total;
    private EstadoPago estadoPago;
    private EstadoRetiro estadoRetiro;
    private List<VentaDTO> ventas;

    public BoletaDTO(){}
}

