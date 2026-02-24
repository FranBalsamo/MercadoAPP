package com.franbalsamo.mercadoapp.model;
import jakarta.persistence.*;
import com.franbalsamo.mercadoapp.model.Cliente;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Table(name = "boletas")
public class Boleta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(nullable = false)
    private Cliente cliente;

    @Column(nullable = false)
    private float total;

    @Column(nullable = false)
    private float deuda;

    public Boleta(){}
    public Boleta(Cliente cliente){
        this.cliente = cliente;
        this.total = 0; // Terminar logica del total
    }
}
