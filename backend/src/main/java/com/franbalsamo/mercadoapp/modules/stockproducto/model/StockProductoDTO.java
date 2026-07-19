package com.franbalsamo.mercadoapp.modules.stockproducto.model;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StockProductoDTO {
    private long id;
    private long id_producto;
    private long id_planilla;
    private float stock;
    private float stock_vendido;

    public StockProductoDTO(){}
}
