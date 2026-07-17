package com.franbalsamo.mercadoapp.modules.cobro.service;

import com.franbalsamo.mercadoapp.modules.boleta.service.BoletaMapper;
import com.franbalsamo.mercadoapp.modules.cobro.model.Cobro;
import com.franbalsamo.mercadoapp.modules.cobro.model.CobroDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class CobroMapper {

    @Autowired
    private BoletaMapper boletaMapper;

    public CobroDTO toDTO(Cobro cobro) {
        if (cobro == null) {
            return null;
        }

        CobroDTO dto = new CobroDTO();
        dto.setId(cobro.getId());
        dto.setId_cliente(cobro.getCliente() != null ? cobro.getCliente().getId() : 0);
        dto.setFecha(cobro.getFecha());
        dto.setFormaPago(cobro.getFormaPago());
        dto.setMontoEntregado(cobro.getMontoEntregado());
        dto.setSaldoAplicado(cobro.getSaldoAplicado());
        dto.setMontoTotalBoletas(cobro.getMontoTotalBoletas());
        dto.setVuelto(cobro.getVuelto());
        dto.setSaldoGenerado(cobro.getSaldoGenerado());

        if (cobro.getBoletas() != null) {
            dto.setBoletas(cobro.getBoletas().stream()
                    .map(boletaMapper::toDTO)
                    .collect(Collectors.toList()));
        }

        return dto;
    }
}
