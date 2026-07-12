package com.franbalsamo.mercadoapp.modules.boleta.service;

import com.franbalsamo.mercadoapp.modules.boleta.model.Boleta;
import com.franbalsamo.mercadoapp.modules.cliente.model.Cliente;
import com.franbalsamo.mercadoapp.modules.planilla.model.Planilla;
import com.franbalsamo.mercadoapp.modules.producto.model.Producto;
import com.franbalsamo.mercadoapp.modules.stockproducto.model.StockProducto;
import com.franbalsamo.mercadoapp.modules.venta.model.Venta;
import com.franbalsamo.mercadoapp.modules.boleta.repository.BoletaRepository;
import com.franbalsamo.mercadoapp.shared.exception.RecursoNoEncontradoException;
import com.franbalsamo.mercadoapp.shared.exception.ReglaNegocioException;
import com.franbalsamo.mercadoapp.modules.boleta.EstadoPago;
import com.franbalsamo.mercadoapp.modules.planilla.EstadoPlanilla;
import com.franbalsamo.mercadoapp.modules.boleta.EstadoRetiro;
import com.franbalsamo.mercadoapp.modules.boleta.FormaPago;
import com.franbalsamo.mercadoapp.modules.boleta.model.BoletaDTO;
import com.franbalsamo.mercadoapp.modules.boleta.model.ResultadoCobroDTO;
import com.franbalsamo.mercadoapp.modules.cliente.model.ClienteDeudorDTO;
import com.franbalsamo.mercadoapp.modules.venta.model.VentaDTO;
import com.franbalsamo.mercadoapp.modules.cliente.service.ClienteService;
import com.franbalsamo.mercadoapp.modules.producto.service.ProductoService;
import com.franbalsamo.mercadoapp.modules.planilla.service.PlanillaService;
import com.franbalsamo.mercadoapp.modules.stockproducto.service.StockProductoService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

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
    public BoletaMapper boletaMapper;

    private void cargarVentas(BoletaDTO boletaDTO, Boleta nuevaBoleta){
        float totalCalculado = 0;
        Planilla planilla = nuevaBoleta.getPlanilla();

        for (VentaDTO vDto : boletaDTO.getVentas()) {
            Producto producto = productoService.findById(vDto.getId_producto());
            StockProducto stockProducto = stockProductoService.findByProductoAndPlanilla(producto, planilla);
            float stockDisponible = stockProducto.getStock() - stockProducto.getStock_vendido();

            if(stockDisponible < vDto.getCantidad()){
                throw new RecursoNoEncontradoException("No hay suficiente inventario para el producto: " + producto.getNombre());
            }

            stockProducto.setStock_vendido(stockProducto.getStock_vendido() + vDto.getCantidad());

            Venta nuevaVenta = new Venta();
            nuevaVenta.setProducto(producto);
            nuevaVenta.setCantidad(vDto.getCantidad());
            nuevaVenta.setPrecio_unitario(vDto.getPrecio_unitario());
            nuevaVenta.setPrecio_vacio(vDto.getPrecio_vacio());

            float subtotal = (vDto.getCantidad() * vDto.getPrecio_unitario()) + (((int)vDto.getCantidad()) * vDto.getPrecio_vacio());
            nuevaVenta.setSubtotal(subtotal);

            nuevaBoleta.addVenta(nuevaVenta);
            totalCalculado += nuevaVenta.getSubtotal();
        }
        nuevaBoleta.setTotal(totalCalculado);
    }

    private void modificarVentas(Boleta boleta, BoletaDTO boletaDTO){
        float totalCalculado = 0;
        Planilla planilla = boleta.getPlanilla();

        List<Venta> ventasActuales = new ArrayList<>(boleta.getVentas());

        for(VentaDTO vDto : boletaDTO.getVentas()){
            Producto producto = productoService.findById(vDto.getId_producto());
            StockProducto stockProducto = stockProductoService.findByProductoAndPlanilla(producto, planilla);

            float stockDisponible = stockProducto.getStock() - stockProducto.getStock_vendido();
            if(stockDisponible < vDto.getCantidad()){
                throw new RecursoNoEncontradoException
                        ("No hay suficiente inventario para el producto: " + producto.getNombre());
            }

            //stockProducto.setStock(stockProducto.getStock() - vDto.getCantidad());
            stockProducto.setStock_vendido(stockProducto.getStock_vendido() + vDto.getCantidad());

            Venta ventaEncontrada = ventasActuales.stream()
                    .filter(v -> v.getId() == vDto.getId())
                    .findFirst()
                    .orElse(null);

            if(ventaEncontrada!=null){
                ventaEncontrada.setProducto(producto);
                ventaEncontrada.setCantidad(vDto.getCantidad());
                ventaEncontrada.setPrecio_unitario(vDto.getPrecio_unitario());
                ventaEncontrada.setPrecio_vacio(vDto.getPrecio_vacio());

                float subtotal = (vDto.getCantidad() * vDto.getPrecio_unitario()) + (((int)vDto.getCantidad()) * vDto.getPrecio_vacio());
                ventaEncontrada.setSubtotal(subtotal);

                ventasActuales.remove(ventaEncontrada);

                totalCalculado += ventaEncontrada.getSubtotal();
            } else{
                Venta nuevaVenta = new Venta();

                nuevaVenta.setProducto(producto);
                nuevaVenta.setCantidad(vDto.getCantidad());
                nuevaVenta.setPrecio_unitario(vDto.getPrecio_unitario());
                nuevaVenta.setPrecio_vacio(vDto.getPrecio_vacio());
                float subtotal = (vDto.getCantidad() * vDto.getPrecio_unitario()) + (((int)vDto.getCantidad()) * vDto.getPrecio_vacio());
                nuevaVenta.setSubtotal(subtotal);
                
                boleta.addVenta(nuevaVenta);

                totalCalculado += nuevaVenta.getSubtotal();
            }
        }

        for(Venta ventaObsoleta : ventasActuales){
            boleta.getVentas().remove(ventaObsoleta);
        }

        boleta.setTotal(totalCalculado);
    }

    private void recuperarStock(Boleta boleta){
        Planilla planilla = boleta.getPlanilla();
        for (Venta venta : boleta.getVentas()) {
            Producto producto = venta.getProducto();
            StockProducto stockProducto = stockProductoService.findByProductoAndPlanilla(producto, planilla);
            //stockProducto.setStock(stockProducto.getStock() + venta.getCantidad()); //Restaurar el stock sin la venta
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
        nuevaBoleta.setEstadoRetiro(boletaDTO.getEstadoRetiro());
        nuevaBoleta.setEstadoPago(boletaDTO.getEstadoPago());
        if(boletaDTO.getFormaPago() != null){
            nuevaBoleta.setFormaPago(boletaDTO.getFormaPago());
        }

        cargarVentas(boletaDTO, nuevaBoleta);

        return boletaMapper.toDTO(boletaRepository.save(nuevaBoleta));
    }

    @Transactional
    public BoletaDTO modificarBoleta(BoletaDTO boletaDTO){
        Boleta boleta = boletaRepository.findById(boletaDTO.getId()) //la boleta que obtenemos es la antigua (la que ya estaba cargada).
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontro la boleta con id: "+ boletaDTO.getId()));

        //Ante de modificar la boleta debemos limpiar el stock de producto para remplazarlo con el nuevo.
        recuperarStock(boleta);

        modificarVentas(boleta,boletaDTO);
        boleta.setEstadoPago(boletaDTO.getEstadoPago());
        boleta.setEstadoRetiro(boletaDTO.getEstadoRetiro());
        if(boletaDTO.getFormaPago() != null){
            boleta.setFormaPago(boletaDTO.getFormaPago());
        }

        Boleta boletaGuardada = boletaRepository.save(boleta);

        recalcularTotalesSiCerrada(boletaGuardada.getPlanilla());

        return boletaMapper.toDTO(boletaGuardada);
    }

    private void recalcularTotalesSiCerrada(Planilla planilla){
        if(planilla.getEstadoPlanilla() != EstadoPlanilla.CERRADA){
            return;
        }

        List<Boleta> boletasDelDia = boletaRepository.findAllByPlanilla(planilla);

        float sumaIngresos = 0;
        float sumaDeuda = 0;

        for(Boleta b : boletasDelDia){
            if(b.getEstadoPago() == EstadoPago.PAGADO){
                sumaIngresos += b.getTotal();
            }else{
                sumaDeuda += b.getTotal();
            }
        }

        planilla.setIngresoTotal(sumaIngresos);
        planilla.setDeudaTotal(sumaDeuda);
        planillaService.updatePlanilla(planilla);
    }

    @Transactional
    public void removeBoleta(long id_boleta){
        Boleta boleta = boletaRepository.findById(id_boleta)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontro la boleta con id: "+ id_boleta));

        if(boleta.getEstadoPago() == EstadoPago.PAGADO || boleta.getEstadoRetiro() == EstadoRetiro.RETIRADO){
            throw new ReglaNegocioException("No se puede eliminar la boleta #" + id_boleta + " porque ya se encuentra pagada y/o retirada.");
        }

        //Antes de eliminar la boleta debemos recuperar el stock del producto.
        recuperarStock(boleta);

        boletaRepository.delete(boleta);
    }

    public List<BoletaDTO> findAll(){
        return boletaRepository.findAll().stream()
                .map(boletaMapper::toDTO)
                .toList();
    }

    public Boleta findById(long id){
        return boletaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontro la boleta con id: "+ id));
    }

    public List<BoletaDTO> findAllByPlanilla(long id_planilla){
        Planilla planilla = planillaService.findById(id_planilla);
        List<Boleta> listaBoleta = boletaRepository.findAllByPlanilla(planilla);
        return listaBoleta.stream()
                .map(boletaMapper::toDTO)
                .toList();
    }

    public List<Boleta> findAllByPlanilla(Planilla planilla){
        return boletaRepository.findAllByPlanilla(planilla);
    }

    public List<BoletaDTO> findByCliente(long id_cliente){
        Cliente cliente = clienteService.findById(id_cliente);
        List<Boleta> listaBoleta = boletaRepository.findAllByCliente(cliente);
        return listaBoleta.stream()
                .map(boletaMapper::toDTO)
                .toList();
    }

    public List<BoletaDTO> findAllDeudasByCliente(long id_cliente){
        Cliente cliente = clienteService.findById(id_cliente);
        List<Boleta> listaBoleta = boletaRepository.
                findAllByClienteAndEstadoPagoAndPlanilla_EstadoPlanilla(
                        cliente,
                        EstadoPago.NO_PAGADO,
                        EstadoPlanilla.CERRADA);
        return  listaBoleta.stream()
                .map(boletaMapper::toDTO)
                .toList();
    }

    public List<ClienteDeudorDTO> findTopDeudores(int cantidad){
        List<Boleta> boletasImpagas = boletaRepository
                .findAllByEstadoPagoAndPlanilla_EstadoPlanilla(EstadoPago.NO_PAGADO, EstadoPlanilla.CERRADA);

        Map<Cliente, Float> deudaPorCliente = new LinkedHashMap<>();
        for (Boleta boleta : boletasImpagas) {
            deudaPorCliente.merge(boleta.getCliente(), boleta.getTotal(), Float::sum);
        }

        return deudaPorCliente.entrySet().stream()
                .sorted(Map.Entry.<Cliente, Float>comparingByValue().reversed())
                .limit(cantidad)
                .map(entry -> new ClienteDeudorDTO(entry.getKey().getId(), entry.getKey().getNombre(), entry.getValue()))
                .toList();
    }

    @Transactional
    public ResultadoCobroDTO cobrarBoletasDeudasSeleccionadas(
            List<Long> listaIds_boletasDeudas, long id_cliente, FormaPago formaPago,
            boolean usarSaldoFavor, float montoEntregado){
        /*
        Este metodo permite pagar las boletas con EstadoPago "NO_PAGADO" que fueron seleccionadas por el usuario.
        El total seleccionado se cubre con el monto entregado y, opcionalmente, el saldo a favor del cliente.
         */
        Cliente cliente = clienteService.findById(id_cliente);
        List<Boleta> listaBoletas = new ArrayList<>();
        float totalSeleccionado = 0;

        for(Long id_boleta : listaIds_boletasDeudas){
            Boleta boleta = boletaRepository.findByIdAndCliente(id_boleta,cliente);
            if(boleta == null){
                throw new RecursoNoEncontradoException("No se encontro la boleta con id: " + id_boleta + " para el cliente con id: " + id_cliente);
            }
            listaBoletas.add(boleta);
            totalSeleccionado += boleta.getTotal();
        }

        //El saldo aplicado se limita a lo que realmente hace falta, para no perder el sobrante como "vuelto".
        float saldoDisponible = cliente.getSaldo_a_favor();
        float saldoAplicado = usarSaldoFavor ? Math.min(saldoDisponible, totalSeleccionado) : 0;
        float totalDisponible = montoEntregado + saldoAplicado;

        if(totalDisponible < totalSeleccionado){
            throw new ReglaNegocioException("Monto insuficiente para cubrir el total seleccionado. Faltan " + (totalSeleccionado - totalDisponible));
        }

        float vuelto = totalDisponible - totalSeleccionado;

        if(usarSaldoFavor){
            cliente.setSaldo_a_favor(saldoDisponible - saldoAplicado);
            clienteService.save(cliente);
        }

        Set<Planilla> planillasAfectadas = new HashSet<>();
        for(Boleta boleta : listaBoletas){
            boleta.setEstadoPago(EstadoPago.PAGADO);
            boleta.setFormaPago(formaPago);
            boletaRepository.save(boleta);
            planillasAfectadas.add(boleta.getPlanilla());
        }

        for(Planilla planilla : planillasAfectadas){
            recalcularTotalesSiCerrada(planilla);
        }

        List<BoletaDTO> boletasDTO = listaBoletas.stream()
                .map(boletaMapper::toDTO)
                .toList();

        return new ResultadoCobroDTO(boletasDTO, vuelto);
    }

    @Transactional
    public List<BoletaDTO> cobrarBoletasDeudasPagoACuenta(long id_cliente, float monto_pago, FormaPago formaPago){
        if(monto_pago <= 0)
            throw new ReglaNegocioException("Monto pago invalido");

        Cliente cliente = clienteService.findById(id_cliente);

        List<Boleta> listaBoletasDeudas = boletaRepository.findDeudasOrdenadasPorFechaYenPlanillaCerradas(
                cliente,
                EstadoPago.NO_PAGADO,
                EstadoPlanilla.CERRADA);
        List<Boleta> listaBoletasPagadas = new ArrayList<>();
        Set<Planilla> planillasAfectadas = new HashSet<>();

        //Se agrega el saldo a favor del cliente para pagar las deudas.
        monto_pago += cliente.getSaldo_a_favor();
        cliente.setSaldo_a_favor(0);
        for(Boleta boletaDeuda : listaBoletasDeudas){
            //Si el monto no alcanza para cubrir esta boleta, se corta aca: el resto queda como saldo a favor
            //y las siguientes boletas (mas nuevas) no se tocan, para no dejar deudas viejas sin pagar por error.
            if(boletaDeuda.getTotal() > monto_pago) {
                break;
            }
            monto_pago -= boletaDeuda.getTotal();
            boletaDeuda.setEstadoPago(EstadoPago.PAGADO);
            boletaDeuda.setFormaPago(formaPago);
            listaBoletasPagadas.add(boletaDeuda);
            boletaRepository.save(boletaDeuda);
            planillasAfectadas.add(boletaDeuda.getPlanilla());
        }
        //Sobro dinero y no es posible pagar una boleta en su totalidad entonces se almacena en saldo a favor
        if(monto_pago > 0){
            cliente.setSaldo_a_favor(monto_pago);
        }

        clienteService.save(cliente);

        for(Planilla planilla : planillasAfectadas){
            recalcularTotalesSiCerrada(planilla);
        }

        return listaBoletasPagadas.stream()
                .map(boletaMapper::toDTO)
                .toList();
    }
}
