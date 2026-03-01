package com.franbalsamo.mercadoapp.Service;

import com.franbalsamo.mercadoapp.Enum.EstadoPago;
import com.franbalsamo.mercadoapp.Repository.BoletaRepository;
import com.franbalsamo.mercadoapp.domain.*;
import com.franbalsamo.mercadoapp.exception.RecursoNoEncontradoException;
import com.franbalsamo.mercadoapp.model.BoletaDTO;
import com.franbalsamo.mercadoapp.model.VentaDTO;
import jakarta.transaction.Transactional;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

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

    @Autowired
    private ModelMapper modelMapper;

    private void cargarVentas(BoletaDTO boletaDTO, Boleta nuevaBoleta){
        float totalCalculado = 0;
        float totalDeuda = 0;

        for (VentaDTO vDto : boletaDTO.getVentasDTO()) {
            Producto producto = productoService.findById(vDto.getId_producto());

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
    }

    @Transactional
    public BoletaDTO newBoleta(BoletaDTO boletaDTO) {

        Cliente cliente = clienteService.findById(boletaDTO.getId_Cliente());

        Planilla planilla = planillaService.findById(boletaDTO.getId_Planilla());

        Boleta nuevaBoleta = new Boleta();
        nuevaBoleta.setCliente(cliente);
        nuevaBoleta.setPlanilla(planilla);
        cargarVentas(boletaDTO, nuevaBoleta);

        return modelMapper.map(boletaRepository.save(nuevaBoleta), BoletaDTO.class);
    }

    @Transactional
    public BoletaDTO modificarBoleta(BoletaDTO boletaDTO){
        Boleta boleta = boletaRepository.findById(boletaDTO.getId_Boleta())
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontro la boleta con id: "+ boletaDTO.getId_Boleta()));

        boleta.getVentas().clear();
        cargarVentas(boletaDTO, boleta);

        return modelMapper.map(boletaRepository.save(boleta), BoletaDTO.class);
    }

    public List<BoletaDTO> findAll(){
        return boletaRepository.findAll().stream()
                .map(boleta -> modelMapper.map(boleta, BoletaDTO.class))
                .toList();
    }

    public Boleta findById(long id){
        return boletaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontro la boleta con id: "+ id));
    }

    public List<BoletaDTO> findByPlanilla(long id_planilla){
        Planilla planilla = planillaService.findById(id_planilla);
        List<Boleta> listaBoleta = boletaRepository.findAllByPlanilla(planilla);
        return listaBoleta.stream().map(boleta -> modelMapper.map(boleta, BoletaDTO.class)).toList();
    }

    public List<BoletaDTO> findByCliente(long id_cliente){
        Cliente cliente = clienteService.findById(id_cliente);
        List<Boleta> listaBoleta = boletaRepository.findAllByCliente(cliente);
        return listaBoleta.stream().map(boleta -> modelMapper.map(boleta, BoletaDTO.class)).toList();
    }

}
