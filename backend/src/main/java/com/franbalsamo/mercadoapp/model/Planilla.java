package com.franbalsamo.mercadoapp.model;
import com.franbalsamo.mercadoapp.model.Boleta;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;

@Getter
@Setter
@Table(name = "planillas")
public class Planilla {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column
    private float gananciasTotal;

    @Column
    private float deudaTotal;

    private ArrayList<Boleta> boletas;
    private ArrayList<StockDiario> stockDiario;

    public Planilla(ArrayList<StockDiario> stockDiario){
        this.fecha=LocalDate.now();
        this.gananciasTotal = 0;
        this.deudaTotal = 0;
        this.boletas = {};
        this.stockDiario = stockDiario;
    }
}
