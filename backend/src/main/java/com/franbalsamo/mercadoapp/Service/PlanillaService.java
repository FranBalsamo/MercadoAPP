package com.franbalsamo.mercadoapp.Service;

import com.franbalsamo.mercadoapp.Repository.PlanillaRepository;
import com.franbalsamo.mercadoapp.Model.Entity.Planilla;
import com.franbalsamo.mercadoapp.Model.Entity.Producto;
import com.franbalsamo.mercadoapp.Model.Entity.StockProducto;
import com.franbalsamo.mercadoapp.Service.exception.RecursoNoEncontradoException;
import com.franbalsamo.mercadoapp.Service.mapper.PlanillaMapper;
import com.franbalsamo.mercadoapp.Service.mapper.StockProductoMapper;
import com.franbalsamo.mercadoapp.Model.DTO.PlanillaDTO;
import com.franbalsamo.mercadoapp.Model.DTO.StockProductoDTO;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PlanillaService {
    @Autowired
    public PlanillaRepository planillaRepository;

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
}
