package com.franbalsamo.mercadoapp.domain;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "productos")
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id_producto;

    @Column(nullable = false)
    private String nombre;

    public Producto(){}
    public Producto(String nombre){
        this.nombre= nombre;
    }
}
