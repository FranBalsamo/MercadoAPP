package com.franbalsamo.mercadoapp.modules.cliente.model;
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

    //Antes de realizar un insert o un update se ejecuta siempre esta funcion!
    @PrePersist
    @PreUpdate
    public void normalizarDatos() {
        this.nombre = this.nombre.trim().toLowerCase();
        if (this.direccion != null) {
            this.direccion = this.direccion.trim().toLowerCase();
        }
    }
}
