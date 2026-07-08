package com.franbalsamo.mercadoapp.modules.boleta.service;

import com.franbalsamo.mercadoapp.modules.boleta.model.Boleta;
import com.franbalsamo.mercadoapp.modules.venta.model.Venta;
import com.franbalsamo.mercadoapp.modules.boleta.model.BoletaDTO;
import com.franbalsamo.mercadoapp.modules.venta.model.VentaDTO;
import com.franbalsamo.mercadoapp.modules.venta.service.VentaMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class BoletaMapper {

    @Autowired
    private VentaMapper ventaMapper;

    public BoletaDTO toDTO(Boleta boleta) {
        if (boleta == null) {
            return null;
        }

        BoletaDTO dto = new BoletaDTO();
        dto.setId(boleta.getId());
        dto.setId_cliente(boleta.getCliente() != null ? boleta.getCliente().getId() : 0);
        dto.setId_planilla(boleta.getPlanilla() != null ? boleta.getPlanilla().getId() : 0);
        dto.setTotal(boleta.getTotal());
        dto.setEstadoPago(boleta.getEstadoPago());
        dto.setEstadoRetiro(boleta.getEstadoRetiro());

        if (boleta.getVentas() != null) {
            dto.setVentas(boleta.getVentas().stream()
                    .map(ventaMapper::toDTO)
                    .collect(Collectors.toList()));
        }

        return dto;
    }

    /*
     * Este metodo se encarga de mapear el DTO a la entidad solo para los atributos
     * que no son otras entidades.
     * Los atributos que corresponden a entidades (ej. id_cliente -> cliente) se
     * deben hacer a mano.
     */

    public Boleta toEntity(BoletaDTO dto) {
        if (dto == null) {
            return null;
        }

        Boleta boleta = new Boleta();
        boleta.setId(dto.getId());
        boleta.setTotal(dto.getTotal());
        boleta.setEstadoPago(dto.getEstadoPago());
        boleta.setEstadoRetiro(dto.getEstadoRetiro());

        // Mapeo la list<VentaDTO> a list<Venta>
        if (dto.getVentas() != null) {
            for (VentaDTO ventaDTO : dto.getVentas()) {
                Venta venta = ventaMapper.toEntity(ventaDTO);
                boleta.addVenta(venta);
            }
        }

        return boleta;
    }
}
