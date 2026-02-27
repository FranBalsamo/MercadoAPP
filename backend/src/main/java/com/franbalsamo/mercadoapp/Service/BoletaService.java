package com.franbalsamo.mercadoapp.Service;

import com.franbalsamo.mercadoapp.Enum.EstadoPago;
import com.franbalsamo.mercadoapp.Repository.BoletaRepository;
import com.franbalsamo.mercadoapp.domain.*;
import com.franbalsamo.mercadoapp.model.BoletaDTO;
import com.franbalsamo.mercadoapp.model.VentaDTO;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class BoletaService {

    @Autowired
    public BoletaRepository boletaRepository;

    @Autowired
    public ClienteService clienteService;

    @Autowired
    public ProductoService productoService;

    @Autowired
    public PlanillaService planillaService;

    @Transactional
    public Boleta newBoleta(BoletaDTO boletaDTO) {

        Cliente cliente = clienteService.findById(boletaDTO.getId_Cliente())
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado con id: " + boletaDTO.getId_Cliente()));

        Planilla planilla = planillaService.findById(boletaDTO.getId_Planilla())
                .orElseThrow(() -> new RuntimeException("Planilla no encontrada con id: " + boletaDTO.getId_Planilla()));

        Boleta nuevaBoleta = new Boleta();
        nuevaBoleta.setCliente(cliente);
        nuevaBoleta.setPlanilla(planilla);

        float totalCalculado = 0;
        float totalDeuda = 0;

        for (VentaDTO vDto : boletaDTO.getVentasDTO()) {
            Producto producto = productoService.findById(vDto.getId_producto())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado con id: " + vDto.getId_producto()));

            Venta nuevaVenta = new Venta();
            nuevaVenta.setProducto(producto);
            nuevaVenta.setCantidad(vDto.getCantidad());
            nuevaVenta.setPrecio_unitario(vDto.getPrecio_unitario());
            nuevaVenta.setSubtotal(vDto.getCantidad() * vDto.getPrecio_unitario());
            nuevaVenta.setEstadoPago(vDto.getEstadoPago());
            nuevaVenta.setEstadoEntrega(vDto.getEstadoEntrega());

            nuevaBoleta.addVenta(nuevaVenta);

            if(nuevaVenta.getEstadoPago() == EstadoPago.NO_PAGADA)
                totalDeuda += nuevaVenta.getSubtotal();
            totalCalculado += nuevaVenta.getSubtotal();
        }
        nuevaBoleta.setTotal(totalCalculado);
        nuevaBoleta.setDeuda(totalDeuda);
        return boletaRepository.save(nuevaBoleta);
    }

}
