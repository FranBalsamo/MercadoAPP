package com.franbalsamo.mercadoapp.domain;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "boletas")
public class Boleta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id_boleta;

    @ManyToOne
    @JoinColumn(name = "id_cliente" )
    private Cliente cliente;

    @ManyToOne
    @JoinColumn(name = "id_planilla")
    private Planilla planilla;

    @Column(nullable = false)
    private float total;

    @Column(nullable = false)
    private float deuda;

    public Boleta(){}
    public Boleta(Cliente cliente, Planilla planilla){
        this.cliente = cliente;
        this.planilla = planilla;
        this.total = 0; // Terminar logica del total
        this.deuda = 0; // Terminar logica de deuda
    }
}
