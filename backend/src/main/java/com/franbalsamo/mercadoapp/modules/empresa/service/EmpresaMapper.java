package com.franbalsamo.mercadoapp.modules.empresa.service;

import com.franbalsamo.mercadoapp.modules.empresa.model.Empresa;
import com.franbalsamo.mercadoapp.modules.empresa.model.EmpresaDTO;
import org.springframework.stereotype.Component;

@Component
public class EmpresaMapper {

    public EmpresaDTO toDTO(Empresa empresa) {
        if (empresa == null) {
            return null;
        }

        EmpresaDTO dto = new EmpresaDTO();
        dto.setId(empresa.getId());
        dto.setNombre(empresa.getNombre());
        dto.setCuit(empresa.getCuit());
        dto.setDireccion(empresa.getDireccion());
        dto.setTelefono(empresa.getTelefono());
        dto.setEmail(empresa.getEmail());
        dto.setLogoBase64(empresa.getLogoBase64());

        return dto;
    }
}
