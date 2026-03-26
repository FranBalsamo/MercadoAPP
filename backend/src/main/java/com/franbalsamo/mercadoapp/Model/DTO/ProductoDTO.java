package com.franbalsamo.mercadoapp.Model.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductoDTO {
    private long id;
    private String nombre;
    private String descripcion;

    public ProductoDTO(){}
}
