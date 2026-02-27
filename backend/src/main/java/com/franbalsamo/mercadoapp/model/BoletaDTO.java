package com.franbalsamo.mercadoapp.model;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class BoletaDTO {
    private long id_Planilla;
    private long id_Cliente;
    private List<VentaDTO> ventasDTO;

    public BoletaDTO(){}
}

