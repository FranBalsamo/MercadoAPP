package com.franbalsamo.mercadoapp.modules.planilla.service;

import com.franbalsamo.mercadoapp.modules.boleta.repository.BoletaRepository;
import com.franbalsamo.mercadoapp.modules.planilla.EstadoPlanilla;
import com.franbalsamo.mercadoapp.modules.planilla.repository.PlanillaRepository;
import com.franbalsamo.mercadoapp.modules.boleta.model.Boleta;
import com.franbalsamo.mercadoapp.modules.planilla.model.Planilla;
import com.franbalsamo.mercadoapp.modules.producto.model.Producto;
import com.franbalsamo.mercadoapp.modules.stockproducto.model.StockProducto;
import com.franbalsamo.mercadoapp.shared.exception.RecursoNoEncontradoException;
import com.franbalsamo.mercadoapp.shared.exception.ReglaNegocioException;
import com.franbalsamo.mercadoapp.modules.producto.service.ProductoService;
import com.franbalsamo.mercadoapp.modules.stockproducto.service.StockProductoMapper;
import com.franbalsamo.mercadoapp.modules.planilla.model.PlanillaDTO;
import com.franbalsamo.mercadoapp.modules.stockproducto.model.StockProductoDTO;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class PlanillaService {
    @Autowired
    public PlanillaRepository planillaRepository;

    @Autowired
    public BoletaRepository boletaRepository;

    @Autowired
    public ProductoService productoService;

    @Autowired
    public PlanillaMapper planillaMapper;

    @Autowired
    public StockProductoMapper stockProductoMapper;

    @Transactional
    public PlanillaDTO newPlanilla(PlanillaDTO planillaDTO){
        if(planillaRepository.findFirstByEstadoPlanilla(EstadoPlanilla.ABIERTA).isPresent()){
            throw new ReglaNegocioException("Ya existe una planilla abierta. Cerrala antes de abrir una nueva.");
        }

        if(planillaDTO.getStockProductos() == null || planillaDTO.getStockProductos().isEmpty()){
            throw new ReglaNegocioException("La planilla debe tener al menos un producto con inventario inicial.");
        }

        Planilla planillaNueva = new Planilla();

        // Sin este control, el mismo producto enviado dos veces crea dos filas de stock para
        // el mismo (producto, planilla): stockProductoService.findByProductoAndPlanilla deja de
        // devolver un resultado unico y rompe TODAS las ventas de ese producto por el resto del dia.
        Set<Long> idsProductosVistos = new HashSet<>();
        for(StockProductoDTO stockProductoDTO : planillaDTO.getStockProductos()) {
            Producto producto = productoService.findById(stockProductoDTO.getId_producto());

            if(!idsProductosVistos.add(producto.getId())){
                throw new ReglaNegocioException("El producto \"" + producto.getNombre() + "\" esta repetido en el inventario inicial.");
            }

            StockProducto stockProducto = new StockProducto();
            stockProducto.setProducto(producto);
            stockProducto.setStock(stockProductoDTO.getStock());
            stockProducto.setStock_vendido(0);

            planillaNueva.addStockProducto(stockProducto);
        }

        Planilla planillaGuardada = planillaRepository.save(planillaNueva);

        return planillaMapper.toDTO(planillaGuardada);
    }

    @Transactional
    public PlanillaDTO updatePlanilla(Planilla planilla){
        Planilla planillaGuardada = planillaRepository.save(planilla);
        return planillaMapper.toDTO(planillaGuardada);
    }

    public List<StockProductoDTO> getStockProductos(long id_planilla){
        Planilla planilla = planillaRepository.findById(id_planilla)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontro la planilla con id: " + id_planilla));

        List<StockProducto> listaStocks = planilla.getStockProductos();
        return listaStocks.stream()
                .map(stockProductoMapper::toDTO)
                .toList();
    }

    public Planilla findById(long id){
        return planillaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontro la planilla con id: " + id));
    }

    public List<PlanillaDTO> findAll(){
        return planillaRepository.findAll().stream()
                .map(planillaMapper::toDTO)
                .toList();
    }

    // VistaPlanillas hoy pide /All completo y filtra en el cliente (por estado o por rango de
    // fechas); este endpoint hace el mismo filtro + paginado en el servidor para no traer el
    // historico entero. 'estado' null trae todas (incluida la ABIERTA), igual que /All hoy.
    public Page<PlanillaDTO> buscarPaginado(EstadoPlanilla estado, LocalDate desde, LocalDate hasta, Pageable pageable){
        return planillaRepository.buscarPaginado(estado, desde, hasta, pageable)
                .map(planillaMapper::toDTO);
    }

    public List<PlanillaDTO> findAllByRangoFechas(LocalDate desde, LocalDate hasta){
        return planillaRepository.findAllByFechaBetween(desde, hasta).stream()
                .map(planillaMapper::toDTO)
                .toList();
    }

    public PlanillaDTO findDTOById(long id){
        return planillaMapper.toDTO(findById(id));
    }

    public Optional<PlanillaDTO> findAbierta(){
        return planillaRepository.findFirstByEstadoPlanilla(EstadoPlanilla.ABIERTA)
                .map(planillaMapper::toDTO);
    }

    @Transactional
    public void delete(long id) {
        Planilla planilla = findById(id);

        List<Boleta> boletas = boletaRepository.findAllByPlanilla(planilla);
        if(!boletas.isEmpty()){
            throw new ReglaNegocioException("No se puede eliminar la planilla porque ya tiene boletas cargadas.");
        }

        planillaRepository.deleteById(id);
    }
}
