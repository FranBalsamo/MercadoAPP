package com.franbalsamo.mercadoapp.modules.boleta.model;

import com.franbalsamo.mercadoapp.modules.boleta.EstadoPago;
import com.franbalsamo.mercadoapp.modules.boleta.EstadoRetiro;
import com.franbalsamo.mercadoapp.modules.boleta.FormaPago;
import com.franbalsamo.mercadoapp.modules.venta.model.VentaDTO;
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
    private FormaPago formaPago;
    private List<VentaDTO> ventas;

    public BoletaDTO(){}
}

