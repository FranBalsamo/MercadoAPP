package com.franbalsamo.mercadoapp.Service;

import com.franbalsamo.mercadoapp.Repository.StockProductoRepository;
import com.franbalsamo.mercadoapp.domain.Planilla;
import com.franbalsamo.mercadoapp.domain.Producto;
import com.franbalsamo.mercadoapp.domain.StockProducto;
import com.franbalsamo.mercadoapp.model.StockProductoDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class StockProductoService {

    @Autowired
    private StockProductoRepository stockProductoRepository;

    public StockProducto findByProductoAndPlanilla(Producto producto, Planilla planilla){
        return stockProductoRepository.findByProductoAndPlanilla(producto, planilla)
                .orElseThrow(() -> new RuntimeException("No se encontro el producto en la planilla"));

    }
}
