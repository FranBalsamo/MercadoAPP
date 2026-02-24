package com.franbalsamo.mercadoapp.model;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "clientes")
public class Cliente {

    @Id
    private String documento;

    @Column(nullable = false)
    private String nombre;

    public Cliente(){
    }

    public Cliente(String documento, String nombre){
        this.documento = documento;
        this.nombre = nombre;
    }
}
