package com.franbalsamo.mercadoapp.modules.cliente.model;

import com.franbalsamo.mercadoapp.modules.cliente.TipoCliente;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ClienteDTO {
    private long id;
    private String documento;
    private String nombre;
    private List<String> direcciones;
    private String telefono;
    private TipoCliente tipoCliente;
    private float saldo_a_favor;

    public ClienteDTO(){}
    public ClienteDTO(String documento, String nombre){
        this.documento = documento;
        this.nombre = nombre;
    }
}

