package com.franbalsamo.mercadoapp.domain;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "planillas")
public class Planilla {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id_planilla;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column
    private float gananciasTotal;

    @Column
    private float deudaTotal;

    public Planilla(){
        this.fecha=LocalDate.now();
        this.gananciasTotal = 0;
        this.deudaTotal = 0;
    }
}
