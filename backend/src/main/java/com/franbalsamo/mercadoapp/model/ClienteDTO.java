package com.franbalsamo.mercadoapp.model;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClienteDTO {
    private long id;
    private String documento;
    private String nombre;
    private String direccion;
    private String telefono;
    private float saldo_a_favor;

    public ClienteDTO(){}
    public ClienteDTO(String documento, String nombre){
        this.documento = documento;
        this.nombre = nombre;
    }
}

