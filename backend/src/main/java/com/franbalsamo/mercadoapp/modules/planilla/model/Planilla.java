package com.franbalsamo.mercadoapp.modules.planilla.model;
import com.franbalsamo.mercadoapp.modules.planilla.EstadoPlanilla;
import com.franbalsamo.mercadoapp.modules.stockproducto.model.StockProducto;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "planillas")
public class Planilla {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @OneToMany(mappedBy = "planilla", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<StockProducto> stockProductos = new ArrayList<>();

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(nullable = false)
    private float ingresoTotal;

    @Column(nullable = false)
    private float deudaTotal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoPlanilla estadoPlanilla;

    public Planilla(){
        this.fecha = LocalDate.now();
        this.ingresoTotal = 0;
        this.deudaTotal = 0;
        this.estadoPlanilla = EstadoPlanilla.ABIERTA;
    }

    public void addStockProducto(StockProducto stockProducto){
        this.stockProductos.add(stockProducto);
        stockProducto.setPlanilla(this);
    }

    public void removeStockProducto(StockProducto stockProducto){
        this.stockProductos.remove(stockProducto);
        stockProducto.setPlanilla(null);
    }
}
