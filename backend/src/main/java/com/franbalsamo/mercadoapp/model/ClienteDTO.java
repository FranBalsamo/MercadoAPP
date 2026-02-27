package com.franbalsamo.mercadoapp.model;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClienteDTO {
    private String documento;
    private String nombre;

    public ClienteDTO(){}
    public ClienteDTO(String documento, String nombre){
        this.documento = documento;
        this.nombre = nombre;
    }
}

