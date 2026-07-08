package com.franbalsamo.mercadoapp.modules.planilla.service;

import com.franbalsamo.mercadoapp.modules.boleta.repository.BoletaRepository;
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
import org.springframework.stereotype.Service;

import java.util.List;

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
        Planilla planillaNueva = new Planilla();

        for(StockProductoDTO stockProductoDTO : planillaDTO.getStockProductos()) {
            Producto producto = productoService.findById(stockProductoDTO.getId_producto());

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

    public PlanillaDTO findDTOById(long id){
        return planillaMapper.toDTO(findById(id));
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
