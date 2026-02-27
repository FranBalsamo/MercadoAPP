package com.franbalsamo.mercadoapp.domain;
import com.franbalsamo.mercadoapp.Enum.EstadoPlanilla;
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

    @Column(nullable = false)
    private float gananciasTotal = 0;

    @Column(nullable = false)
    private float deudaTotal = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoPlanilla estadoPlanilla;

    public Planilla(){};

    public Planilla(LocalDate fecha, EstadoPlanilla estadoPlanilla){
        this.fecha = fecha;
        this.estadoPlanilla = estadoPlanilla;
    }
}
