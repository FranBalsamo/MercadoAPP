package com.franbalsamo.mercadoapp.modules.cliente.service;

import com.franbalsamo.mercadoapp.modules.cliente.model.Cliente;
import com.franbalsamo.mercadoapp.modules.cliente.model.ClienteDTO;
import org.springframework.stereotype.Component;

@Component
public class ClienteMapper {

    public ClienteDTO toDTO(Cliente cliente) {
        if (cliente == null) {
            return null;
        }

        ClienteDTO dto = new ClienteDTO();
        dto.setId(cliente.getId());
        dto.setDocumento(cliente.getDocumento());
        dto.setNombre(cliente.getNombre());
        dto.setDirecciones(cliente.getDirecciones());
        dto.setTelefono(cliente.getTelefono());
        dto.setTipoCliente(cliente.getTipoCliente());
        dto.setSaldo_a_favor(cliente.getSaldo_a_favor());

        return dto;
    }

    public Cliente toEntity(ClienteDTO dto) {
        if (dto == null) {
            return null;
        }

        Cliente cliente = new Cliente();
        cliente.setId(dto.getId());
        cliente.setDocumento(dto.getDocumento());
        cliente.setNombre(dto.getNombre());
        cliente.setDirecciones(dto.getDirecciones());
        cliente.setTelefono(dto.getTelefono());
        cliente.setTipoCliente(dto.getTipoCliente());
        cliente.setSaldo_a_favor(dto.getSaldo_a_favor());

        return cliente;
    }
}
