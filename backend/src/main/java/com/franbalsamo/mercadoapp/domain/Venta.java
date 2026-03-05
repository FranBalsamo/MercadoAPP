package com.franbalsamo.mercadoapp.domain;
import com.franbalsamo.mercadoapp.Enum.EstadoEntrega;
import com.franbalsamo.mercadoapp.Enum.EstadoPago;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "Ventas")
public class Venta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id_venta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_boleta", nullable = false)
    private Boleta boleta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_producto", nullable = false)
    private Producto producto;

    @Column(nullable = false)
    private int cantidad;

    @Column(nullable = false)
    private float precio_unitario;

    @Column(nullable = false)
    private float precio_vacio;

    @Column
    private float subtotal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoPago estadoPago;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoEntrega estadoEntrega;

    public Venta(){}

}
