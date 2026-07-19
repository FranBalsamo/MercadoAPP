package com.franbalsamo.mercadoapp.modules.venta.model;
import com.franbalsamo.mercadoapp.modules.boleta.model.Boleta;
import com.franbalsamo.mercadoapp.modules.producto.model.Producto;
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
    private long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_boleta", nullable = false)
    private Boleta boleta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_producto", nullable = false)
    private Producto producto;

    @Column(nullable = false)
    private float cantidad;

    @Column(nullable = false)
    private float precio_unitario;

    @Column(nullable = false)
    private float precio_vacio;

    @Column
    private float subtotal;

    // Cuanto de esta linea (de la cantidad vendida) se entrego realmente.
    // Se recalcula siempre en base al EstadoEntrega elegido para la boleta (ver BoletaService).
    @Column
    private float cantidad_entregada = 0;

    public Venta(){}

}
