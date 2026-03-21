package com.franbalsamo.mercadoapp.mapper;

import com.franbalsamo.mercadoapp.domain.StockProducto;
import com.franbalsamo.mercadoapp.model.StockProductoDTO;
import org.springframework.stereotype.Component;

@Component
public class StockProductoMapper {

    public StockProductoDTO toDTO(StockProducto stockProducto) {
        if (stockProducto == null) {
            return null;
        }

        StockProductoDTO dto = new StockProductoDTO();
        dto.setId(stockProducto.getId());
        dto.setId_producto(stockProducto.getProducto() != null ? stockProducto.getProducto().getId() : 0);
        dto.setId_planilla(stockProducto.getPlanilla() != null ? stockProducto.getPlanilla().getId() : 0);
        dto.setStock(stockProducto.getStock());
        dto.setStock_vendido(stockProducto.getStock_vendido());

        return dto;
    }

    public StockProducto toEntity(StockProductoDTO dto) {
        if (dto == null) {
            return null;
        }

        StockProducto stockProducto = new StockProducto();
        stockProducto.setId(dto.getId());
        stockProducto.setStock(dto.getStock());
        stockProducto.setStock_vendido(dto.getStock_vendido());

        return stockProducto;
    }
}
