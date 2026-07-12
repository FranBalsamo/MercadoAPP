package com.franbalsamo.mercadoapp.modules.venta.service;

import com.franbalsamo.mercadoapp.modules.venta.model.ProductoVendidoDTO;
import com.franbalsamo.mercadoapp.modules.venta.repository.VentaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class VentaService {

    @Autowired
    private VentaRepository ventaRepository;

    public List<ProductoVendidoDTO> findTopProductosVendidos(LocalDate desde, LocalDate hasta, int limite){
        List<Object[]> filas = ventaRepository.findCantidadVendidaPorProducto(desde, hasta);

        return filas.stream()
                .map(fila -> new ProductoVendidoDTO(
                        (Long) fila[0],
                        (String) fila[1],
                        ((Number) fila[2]).floatValue()))
                .limit(limite)
                .toList();
    }
}
