package com.franbalsamo.mercadoapp.Service.mapper;

import com.franbalsamo.mercadoapp.Model.Entity.Planilla;
import com.franbalsamo.mercadoapp.Model.DTO.PlanillaDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class PlanillaMapper {

    @Autowired
    private StockProductoMapper stockProductoMapper;

    public PlanillaDTO toDTO(Planilla planilla) {
        if (planilla == null) {
            return null;
        }

        PlanillaDTO dto = new PlanillaDTO();
        dto.setId(planilla.getId());
        dto.setFecha(planilla.getFecha());
        dto.setIngresoTotal(planilla.getIngresoTotal());
        dto.setDeudaTotal(planilla.getDeudaTotal());
        dto.setEstadoPlanilla(planilla.getEstadoPlanilla());

        if (planilla.getStockProductos() != null) {
            dto.setStockProductos(planilla.getStockProductos().stream()
                    .map(stockProductoMapper::toDTO)
                    .collect(Collectors.toList()));
        }

        return dto;
    }

    public Planilla toEntity(PlanillaDTO dto) {
        if (dto == null) {
            return null;
        }

        Planilla planilla = new Planilla();
        planilla.setId(dto.getId());
        planilla.setFecha(dto.getFecha());
        planilla.setIngresoTotal(dto.getIngresoTotal());
        planilla.setDeudaTotal(dto.getDeudaTotal());
        planilla.setEstadoPlanilla(dto.getEstadoPlanilla());

        return planilla;
    }
}
