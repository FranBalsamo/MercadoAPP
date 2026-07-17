package com.franbalsamo.mercadoapp.modules.cobro.model;

import com.franbalsamo.mercadoapp.modules.boleta.FormaPago;
import com.franbalsamo.mercadoapp.modules.boleta.model.Boleta;
import com.franbalsamo.mercadoapp.modules.cliente.model.Cliente;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

// Registra cada operacion de cobro de deuda (o aporte a cuenta) de un cliente: a diferencia
// de Boleta, que solo guarda su estado final (PAGADO/NO_PAGADO), este es el unico lugar donde
// queda la fecha real en la que se cobro, cuanto entrego el cliente, y que boletas se
// saldaron juntas en ese mismo acto.
@Getter
@Setter
@Entity
@Table(name = "cobros")
public class Cobro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_cliente", nullable = false)
    private Cliente cliente;

    @Column(nullable = false)
    private LocalDate fecha;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FormaPago formaPago;

    // Dinero nuevo que entrego el cliente en este acto (sin contar el saldo a favor que ya tenia).
    @Column(nullable = false)
    private float montoEntregado;

    // Cuanto de su saldo a favor previo se uso para cubrir este cobro.
    @Column(nullable = false)
    private float saldoAplicado;

    // Suma de las boletas efectivamente saldadas en este cobro (0 si fue un aporte a cuenta
    // que no alcanzo a cubrir ninguna boleta completa).
    @Column(nullable = false)
    private float montoTotalBoletas;

    // Si sobro dinero y se le devolvio en mano al cliente.
    @Column(nullable = false)
    private float vuelto;

    // Si sobro dinero y quedo como saldo a favor en vez de devolverse.
    @Column(nullable = false)
    private float saldoGenerado;

    @OneToMany(mappedBy = "cobro")
    private List<Boleta> boletas = new ArrayList<>();

    public Cobro() {
        this.fecha = LocalDate.now();
    }
}
