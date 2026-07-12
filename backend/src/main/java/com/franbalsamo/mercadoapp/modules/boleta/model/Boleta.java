package com.franbalsamo.mercadoapp.modules.boleta.model;
import com.franbalsamo.mercadoapp.modules.boleta.EstadoPago;
import com.franbalsamo.mercadoapp.modules.boleta.EstadoRetiro;
import com.franbalsamo.mercadoapp.modules.boleta.FormaPago;
import com.franbalsamo.mercadoapp.modules.cliente.model.Cliente;
import com.franbalsamo.mercadoapp.modules.planilla.model.Planilla;
import com.franbalsamo.mercadoapp.modules.venta.model.Venta;
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
    private long id;

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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoPago estadoPago;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoRetiro estadoRetiro;

    @Enumerated(EnumType.STRING)
    private FormaPago formaPago;

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
