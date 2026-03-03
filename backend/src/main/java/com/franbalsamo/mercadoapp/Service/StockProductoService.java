package com.franbalsamo.mercadoapp.Service;

import com.franbalsamo.mercadoapp.Repository.StockProductoRepository;
import com.franbalsamo.mercadoapp.domain.Planilla;
import com.franbalsamo.mercadoapp.domain.Producto;
import com.franbalsamo.mercadoapp.domain.StockProducto;
import com.franbalsamo.mercadoapp.exception.RecursoNoEncontradoException;
import com.franbalsamo.mercadoapp.exception.ReglaNegocioException;
import com.franbalsamo.mercadoapp.model.StockProductoDTO;
import jakarta.transaction.Transactional;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class StockProductoService {

    @Autowired
    private StockProductoRepository stockProductoRepository;
    @Autowired
    private PlanillaService planillaService;
    @Autowired
    private ProductoService productoService;
    @Autowired
    private ModelMapper modelMapper;

    public StockProducto findByProductoAndPlanilla(Producto producto, Planilla planilla){
        return stockProductoRepository.findByProductoAndPlanilla(producto, planilla)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontro el producto en la planilla"));
    }

    @Transactional
    public StockProductoDTO addStock(StockProductoDTO stockProductoDTO, int cantidadAjuste){
        Planilla planilla = planillaService.findById(stockProductoDTO.getId_planilla());
        Producto producto = productoService.findById(stockProductoDTO.getId_producto());
        StockProducto stockProducto = stockProductoRepository.findByProductoAndPlanilla(producto, planilla)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontro el producto en la planilla"));
        int nuevoStock = stockProducto.getStock() + cantidadAjuste;
        if(nuevoStock < 0){
            throw new ReglaNegocioException("Error: El ajuste dejaria en stock negativo");
        }
        stockProducto.setStock(nuevoStock);

        return modelMapper.map(stockProductoRepository.save(stockProducto), StockProductoDTO.class);
    }

    @Transactional
    public StockProductoDTO removeStock(StockProductoDTO stockProductoDTO, int cantidadAjuste){
        Planilla planilla = planillaService.findById(stockProductoDTO.getId_planilla());
        Producto producto = productoService.findById(stockProductoDTO.getId_producto());

        StockProducto stockDiario = stockProductoRepository.findByProductoAndPlanilla(producto, planilla)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontro el producto en la planilla"));

        int nuevoStock = stockDiario.getStock() - cantidadAjuste;
        if(nuevoStock < 0){
            throw new ReglaNegocioException("Error: El ajuste dejaria en stock negativo");
        }

        stockDiario.setStock(nuevoStock);
        return modelMapper.map(stockProductoRepository.save(stockDiario), StockProductoDTO.class);
    }
}
