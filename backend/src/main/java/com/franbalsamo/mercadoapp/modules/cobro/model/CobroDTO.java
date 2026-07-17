package com.franbalsamo.mercadoapp.modules.cobro.model;

import com.franbalsamo.mercadoapp.modules.boleta.FormaPago;
import com.franbalsamo.mercadoapp.modules.boleta.model.BoletaDTO;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class CobroDTO {
    private long id;
    private long id_cliente;
    private LocalDate fecha;
    private FormaPago formaPago;
    private float montoEntregado;
    private float saldoAplicado;
    private float montoTotalBoletas;
    private float vuelto;
    private float saldoGenerado;
    private List<BoletaDTO> boletas;

    public CobroDTO() {}
}
