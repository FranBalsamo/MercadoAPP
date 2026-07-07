package com.franbalsamo.mercadoapp.Model.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClienteDeudorDTO {
    private long id;
    private String nombre;
    private float deudaTotal;

    public ClienteDeudorDTO(){}

    public ClienteDeudorDTO(long id, String nombre, float deudaTotal){
        this.id = id;
        this.nombre = nombre;
        this.deudaTotal = deudaTotal;
    }
}
