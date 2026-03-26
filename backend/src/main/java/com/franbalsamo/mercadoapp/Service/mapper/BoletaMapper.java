package com.franbalsamo.mercadoapp.Service.mapper;

import com.franbalsamo.mercadoapp.Service.ClienteService;
import com.franbalsamo.mercadoapp.Service.VentaService;
import com.franbalsamo.mercadoapp.Model.Entity.Boleta;
import com.franbalsamo.mercadoapp.Model.Entity.Venta;
import com.franbalsamo.mercadoapp.Model.DTO.BoletaDTO;
import com.franbalsamo.mercadoapp.Model.DTO.VentaDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class BoletaMapper {

    @Autowired
    private VentaMapper ventaMapper;

    @Autowired
    private VentaService ventaService;

    @Autowired
    private ClienteService clienteService;

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
    Este metodo se encarga de mapear el DTO a la entidad solo para los atributos que no son otras entidades.
    Los atributos que corresponden a entidades (ej. id_cliente -> cliente) se deben hacer a mano.
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

        //Mapeo la list<VentaDTO> a list<Venta>
        if (dto.getVentas() != null) {
            for (VentaDTO ventaDTO : dto.getVentas()) {
                Venta venta = ventaMapper.toEntity(ventaDTO);
                boleta.addVenta(venta);
            }
        }

        return boleta;
    }
}
