package com.franbalsamo.mercadoapp.domain;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "clientes")
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(unique = true, nullable = false)
    private String documento;

    @Column(nullable = false)
    private String nombre;

    @Column()
    private String direccion;

    @Column()
    private String telefono;

    @Column(nullable = false)
    private float saldo_a_favor = 0;

    public Cliente(){
    }
}
