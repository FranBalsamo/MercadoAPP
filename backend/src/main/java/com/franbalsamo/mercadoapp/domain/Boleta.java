package com.franbalsamo.mercadoapp.domain;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "boletas")
public class Boleta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id_boleta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_cliente" ,nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_planilla",nullable = false)
    private Planilla planilla;

    @OneToMany(mappedBy = "boleta", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Venta> ventas = new ArrayList<>();

    @Column(nullable = false)
    private float total;

    @Column(nullable = false)
    private float deuda;

    public Boleta(){}

    public void addVenta(Venta venta){
        this.ventas.add(venta);
        venta.setBoleta(this);
    }
    public void removeVenta(Venta venta){
        this.ventas.remove(venta);
        venta.setBoleta(null);
    }

}
