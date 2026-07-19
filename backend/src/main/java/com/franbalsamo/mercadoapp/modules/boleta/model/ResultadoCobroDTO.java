package com.franbalsamo.mercadoapp.modules.boleta.model;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ResultadoCobroDTO {
    private List<BoletaDTO> boletas;
    private float vuelto;

    public ResultadoCobroDTO(){}

    public ResultadoCobroDTO(List<BoletaDTO> boletas, float vuelto){
        this.boletas = boletas;
        this.vuelto = vuelto;
    }
}
