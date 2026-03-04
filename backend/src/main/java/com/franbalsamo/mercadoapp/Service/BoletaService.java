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

import java.util.ArrayList;
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
    public StockProductoService stockProductoService;

    @Autowired
    private ModelMapper modelMapper;

    private void cargarVentas(BoletaDTO boletaDTO, Boleta nuevaBoleta){
        float totalCalculado = 0;
        float totalDeuda = 0;
        Planilla planilla = nuevaBoleta.getPlanilla();

        for (VentaDTO vDto : boletaDTO.getVentasDTO()) {
            Producto producto = productoService.findById(vDto.getId_producto());

            StockProducto stockProducto = stockProductoService.findByProductoAndPlanilla(producto, planilla);
            if(stockProducto.getStock() < vDto.getCantidad()){
                throw new RecursoNoEncontradoException("No hay suficiente stock para el producto: " + producto.getNombre());
            }

            stockProducto.setStock(stockProducto.getStock() - vDto.getCantidad());
            stockProducto.setStock_vendido(stockProducto.getStock_vendido() + vDto.getCantidad());

            Venta nuevaVenta = new Venta();
            nuevaVenta.setProducto(producto);
            nuevaVenta.setCantidad(vDto.getCantidad());
            nuevaVenta.setPrecio_unitario(vDto.getPrecio_unitario());
            nuevaVenta.setSubtotal(vDto.getCantidad() * vDto.getPrecio_unitario());
            nuevaVenta.setEstadoPago(vDto.getEstadoPago());
            nuevaVenta.setEstadoEntrega(vDto.getEstadoEntrega());

            nuevaBoleta.addVenta(nuevaVenta);

            if(nuevaVenta.getEstadoPago() == EstadoPago.NO_PAGADO)
                totalDeuda += nuevaVenta.getSubtotal();
            totalCalculado += nuevaVenta.getSubtotal();
        }
        nuevaBoleta.setTotal(totalCalculado);
        nuevaBoleta.setDeuda(totalDeuda);
    }

    private void modificarVentas(Boleta boleta, BoletaDTO boletaDTO){
        float totalCalculado = 0;
        float totalDeuda = 0;
        Planilla planilla = boleta.getPlanilla();

        List<Venta> ventasActuales = new ArrayList<>(boleta.getVentas());

        for(VentaDTO vDto : boletaDTO.getVentasDTO()){
            Producto producto = productoService.findById(vDto.getId_producto());
            StockProducto stockProducto = stockProductoService.findByProductoAndPlanilla(producto, planilla);

            if(stockProducto.getStock() < vDto.getCantidad()){
                throw new RecursoNoEncontradoException
                        ("No hay suficiente stock para el producto: " + producto.getNombre());
            }

            stockProducto.setStock(stockProducto.getStock() - vDto.getCantidad());
            stockProducto.setStock_vendido(stockProducto.getStock_vendido() + vDto.getCantidad());

            Venta ventaEncontrada = ventasActuales.stream()
                    .filter(v -> v.getId_venta() == vDto.getId_venta())
                    .findFirst()
                    .orElse(null);

            if(ventaEncontrada!=null){
                ventaEncontrada.setProducto(producto);
                ventaEncontrada.setCantidad(vDto.getCantidad());
                ventaEncontrada.setPrecio_unitario(vDto.getPrecio_unitario());
                ventaEncontrada.setSubtotal(vDto.getCantidad()*vDto.getPrecio_unitario());
                ventaEncontrada.setEstadoPago(vDto.getEstadoPago());
                ventaEncontrada.setEstadoEntrega(vDto.getEstadoEntrega());

                ventasActuales.remove(ventaEncontrada);

                if(ventaEncontrada.getEstadoPago() == EstadoPago.NO_PAGADO) totalDeuda += ventaEncontrada.getSubtotal();
                totalCalculado += ventaEncontrada.getSubtotal();
            } else{
                Venta nuevaVenta = new Venta();

                nuevaVenta.setProducto(producto);
                nuevaVenta.setCantidad(vDto.getCantidad());
                nuevaVenta.setPrecio_unitario(vDto.getPrecio_unitario());
                nuevaVenta.setSubtotal(vDto.getCantidad()* vDto.getPrecio_unitario());
                nuevaVenta.setEstadoPago(vDto.getEstadoPago());
                nuevaVenta.setEstadoEntrega(vDto.getEstadoEntrega());

                boleta.addVenta(nuevaVenta);

                if(nuevaVenta.getEstadoPago() == EstadoPago.NO_PAGADO) totalDeuda+= nuevaVenta.getSubtotal();
                totalCalculado+= nuevaVenta.getSubtotal();
            }
        }

        for(Venta ventaObsoleta : ventasActuales){
            boleta.getVentas().remove(ventaObsoleta);
        }

        boleta.setTotal(totalCalculado);
        boleta.setDeuda(totalDeuda);
    }

    private void recuperarStock(Boleta boleta){
        Planilla planilla = boleta.getPlanilla();
        for (Venta venta : boleta.getVentas()) {
            Producto producto = venta.getProducto();
            StockProducto stockProducto = stockProductoService.findByProductoAndPlanilla(producto, planilla);
            stockProducto.setStock(stockProducto.getStock() + venta.getCantidad()); //Restaurar el stock sin la venta
            stockProducto.setStock_vendido(stockProducto.getStock_vendido() - venta.getCantidad()); //Restaurar el stock vendido sin la venta
        }
    }

    @Transactional
    public BoletaDTO newBoleta(BoletaDTO boletaDTO) {

        Cliente cliente = clienteService.findById(boletaDTO.getId_cliente());

        Planilla planilla = planillaService.findById(boletaDTO.getId_planilla());

        Boleta nuevaBoleta = new Boleta();
        nuevaBoleta.setCliente(cliente);
        nuevaBoleta.setPlanilla(planilla);
        cargarVentas(boletaDTO, nuevaBoleta);

        return modelMapper.map(boletaRepository.save(nuevaBoleta), BoletaDTO.class);
    }

    @Transactional
    public BoletaDTO modificarBoleta(BoletaDTO boletaDTO){
        Boleta boleta = boletaRepository.findById(boletaDTO.getId_boleta()) //la boleta que obtenemos es la antigua (la que ya estaba cargada).
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontro la boleta con id: "+ boletaDTO.getId_boleta()));

        //Ante de modificar la boleta debemos limpiar el stock de producto para remplazarlo con el nuevo.
        recuperarStock(boleta);

        modificarVentas(boleta,boletaDTO);

        return modelMapper.map(boletaRepository.save(boleta), BoletaDTO.class); //Guardar la boleta modificada.
    }

    @Transactional
    public void removeBoleta(long id_boleta){
        Boleta boleta = boletaRepository.findById(id_boleta)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontro la boleta con id: "+ id_boleta));

        //Antes de eliminar la boleta debemos recuperar el stock del producto.
        recuperarStock(boleta);

        boletaRepository.delete(boleta);
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
