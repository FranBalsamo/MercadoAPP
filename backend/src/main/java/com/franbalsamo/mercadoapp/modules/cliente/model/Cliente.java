package com.franbalsamo.mercadoapp.modules.cliente.model;
import com.franbalsamo.mercadoapp.modules.cliente.TipoCliente;
import com.franbalsamo.mercadoapp.modules.cliente.TipoDocumento;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

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

    // Un SUPERMERCADO siempre usa CUIT_L (se fuerza en ClienteService); solo un PERSONA
    // puede elegir entre DNI o CUIT_L.
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(20) DEFAULT 'DNI'")
    private TipoDocumento tipoDocumento = TipoDocumento.DNI;

    @Column(nullable = false)
    private String nombre;

    @ElementCollection
    @CollectionTable(name = "cliente_direcciones", joinColumns = @JoinColumn(name = "id_cliente"))
    @Column(name = "direccion")
    private List<String> direcciones = new ArrayList<>();

    @Column()
    private String telefono;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoCliente tipoCliente = TipoCliente.PERSONA;

    @Column(nullable = false)
    private float saldo_a_favor = 0;

    public Cliente(){
    }

    //Antes de realizar un insert o un update se ejecuta siempre esta funcion!
    // Ojo: aca solo se normalizan campos simples. Reemplazar la referencia de "direcciones"
    // (un @ElementCollection) desde un callback de ciclo de vida rompe el dirty-checking de
    // Hibernate en los updates; esa normalizacion se hace en ClienteService, mutando la
    // coleccion ya gestionada en vez de reemplazarla.
    @PrePersist
    @PreUpdate
    public void normalizarDatos() {
        this.nombre = this.nombre.trim().toLowerCase();
    }
}
