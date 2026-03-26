package com.franbalsamo.mercadoapp.Service.mapper;

import com.franbalsamo.mercadoapp.Model.Entity.Cliente;
import com.franbalsamo.mercadoapp.Model.DTO.ClienteDTO;
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
        dto.setDireccion(cliente.getDireccion());
        dto.setTelefono(cliente.getTelefono());
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
        cliente.setDireccion(dto.getDireccion());
        cliente.setTelefono(dto.getTelefono());
        cliente.setSaldo_a_favor(dto.getSaldo_a_favor());

        return cliente;
    }
}
