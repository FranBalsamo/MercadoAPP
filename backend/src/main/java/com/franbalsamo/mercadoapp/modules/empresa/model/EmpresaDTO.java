package com.franbalsamo.mercadoapp.modules.empresa.model;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EmpresaDTO {
    private long id;
    private String nombre;
    private String cuit;
    private String direccion;
    private String telefono;
    private String email;
    private String logoBase64;
}
