package com.franbalsamo.mercadoapp.modules.empresa.model;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "empresa")
public class Empresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(length = 150)
    private String nombre;

    @Column(length = 50)
    private String cuit;

    @Column(length = 255)
    private String direccion;

    @Column(length = 50)
    private String telefono;

    @Column(length = 150)
    private String email;

    @Lob
    @Column(name = "logo_base64", columnDefinition = "LONGTEXT")
    private String logoBase64;

    public Empresa(){}
}
