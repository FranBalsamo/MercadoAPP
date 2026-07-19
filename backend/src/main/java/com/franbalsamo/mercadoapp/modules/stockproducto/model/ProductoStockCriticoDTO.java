package com.franbalsamo.mercadoapp.modules.stockproducto.model;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductoStockCriticoDTO {
    private long idProducto;
    private String nombre;
    private long vecesAgotado;

    public ProductoStockCriticoDTO(){}

    public ProductoStockCriticoDTO(long idProducto, String nombre, long vecesAgotado){
        this.idProducto = idProducto;
        this.nombre = nombre;
        this.vecesAgotado = vecesAgotado;
    }
}
