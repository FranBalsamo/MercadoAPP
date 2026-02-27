package com.franbalsamo.mercadoapp.model;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClienteDTO {
    private long id_cliente;
    private String documento;
    private String nombre;

    public ClienteDTO(){}
    public ClienteDTO(String documento, String nombre){
        this.documento = documento;
        this.nombre = nombre;
    }
}

