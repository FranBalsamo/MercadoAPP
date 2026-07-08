package com.franbalsamo.mercadoapp.modules.venta.service;

import com.franbalsamo.mercadoapp.modules.venta.model.Venta;
import com.franbalsamo.mercadoapp.modules.venta.model.VentaDTO;
import org.springframework.stereotype.Component;

@Component
public class VentaMapper {

    public VentaDTO toDTO(Venta venta) {
        if (venta == null) {
            return null;
        }

        VentaDTO dto = new VentaDTO();
        dto.setId(venta.getId());
        dto.setId_boleta(venta.getBoleta() != null ? venta.getBoleta().getId() : 0);
        dto.setId_producto(venta.getProducto() != null ? venta.getProducto().getId() : 0);
        dto.setCantidad(venta.getCantidad());
        dto.setPrecio_unitario(venta.getPrecio_unitario());
        dto.setPrecio_vacio(venta.getPrecio_vacio());

        return dto;
    }

    /*
    Este metodo se encarga de mapear el DTO a la entidad solo para los atributos que no son otras entidades.
    Los atributos que corresponden a entidades (ej. id_cliente -> cliente) se deben hacer a mano.
     */

    public Venta toEntity(VentaDTO dto) {
        if (dto == null) {
            return null;
        }

        Venta venta = new Venta();
        venta.setId(dto.getId());
        venta.setCantidad(dto.getCantidad());
        venta.setPrecio_unitario(dto.getPrecio_unitario());
        venta.setPrecio_vacio(dto.getPrecio_vacio());
        float subtotal = (dto.getCantidad() * dto.getPrecio_unitario()) + (((int)dto.getCantidad()) * dto.getPrecio_vacio());
        venta.setSubtotal(subtotal);


        return venta;
    }
}
