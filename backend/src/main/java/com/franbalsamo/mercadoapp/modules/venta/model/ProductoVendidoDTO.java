package com.franbalsamo.mercadoapp.modules.venta.model;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductoVendidoDTO {
    private long idProducto;
    private String nombre;
    private float cantidadVendida;

    public ProductoVendidoDTO(){}

    public ProductoVendidoDTO(long idProducto, String nombre, float cantidadVendida){
        this.idProducto = idProducto;
        this.nombre = nombre;
        this.cantidadVendida = cantidadVendida;
    }
}
