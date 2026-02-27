package com.franbalsamo.mercadoapp.model;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductoDTO {
    private long id_producto;
    private String nombre;

    public ProductoDTO(){}
}
