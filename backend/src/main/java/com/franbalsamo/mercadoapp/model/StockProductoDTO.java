package com.franbalsamo.mercadoapp.model;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StockProductoDTO {
    private long id;
    private long id_producto;
    private long id_planilla;
    private int stock;
    private int stock_vendido;

    public StockProductoDTO(){}
}
