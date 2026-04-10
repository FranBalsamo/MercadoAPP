package com.franbalsamo.mercadoapp.Model.Entity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "Stock_Producto")
public class StockProducto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @ManyToOne
    @JoinColumn(name = "id_producto")
    private Producto producto;

    @ManyToOne
    @JoinColumn(name = "id_planilla")
    private Planilla planilla;

    @Column(nullable = false)
    private float stock;

    @Column(nullable = false)
    private float stock_vendido;

    public StockProducto(){
        this.stock_vendido = 0;
    }
}