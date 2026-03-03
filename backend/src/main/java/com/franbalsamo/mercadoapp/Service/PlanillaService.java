package com.franbalsamo.mercadoapp.Service;

import com.franbalsamo.mercadoapp.Enum.EstadoPlanilla;
import com.franbalsamo.mercadoapp.Repository.PlanillaRepository;
import com.franbalsamo.mercadoapp.domain.Planilla;
import com.franbalsamo.mercadoapp.domain.Producto;
import com.franbalsamo.mercadoapp.domain.StockProducto;
import com.franbalsamo.mercadoapp.exception.RecursoNoEncontradoException;
import com.franbalsamo.mercadoapp.model.PlanillaDTO;
import com.franbalsamo.mercadoapp.model.StockProductoDTO;
import jakarta.transaction.Transactional;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class PlanillaService {
    @Autowired
    public PlanillaRepository planillaRepository;

    @Autowired
    public ProductoService productoService;

    @Autowired
    public StockProductoService stockProductoService;

    @Autowired
    private ModelMapper modelMapper;

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
        return modelMapper.map(planillaRepository.save(planillaNueva), PlanillaDTO.class);
    }

    public Planilla findById(long id){
        return planillaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontro la planilla con id: "+ id));
    }

}
