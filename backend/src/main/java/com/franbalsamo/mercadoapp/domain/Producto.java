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
    private long id;

    @Column(nullable = false, unique = true)
    private String nombre;

    @Column(length = 255)
    private String descripcion;

    public Producto(){}
    public Producto(String nombre){
        this.nombre= nombre;
    }
}
