package com.franbalsamo.mercadoapp.model;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductoDTO {
    private String nombre;

    public ProductoDTO(){}
    public ProductoDTO(String nombre){
        this.nombre = nombre;
    }
}
