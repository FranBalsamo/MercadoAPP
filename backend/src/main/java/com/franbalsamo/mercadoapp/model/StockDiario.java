package com.franbalsamo.mercadoapp.model;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Getter
@Setter
public class StockDiario {
    private int stock;
    private Producto producto;
    private LocalDate fecha;

    public StockDiario(){}

    public StockDiario(int stock, Producto producto){
        this.stock = stock;
        this.producto = producto;
        this.fecha = LocalDate.now();
    }
}
