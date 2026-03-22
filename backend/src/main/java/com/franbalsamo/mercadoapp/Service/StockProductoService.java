package com.franbalsamo.mercadoapp.Service;

import com.franbalsamo.mercadoapp.Repository.StockProductoRepository;
import com.franbalsamo.mercadoapp.domain.Planilla;
import com.franbalsamo.mercadoapp.domain.Producto;
import com.franbalsamo.mercadoapp.domain.StockProducto;
import com.franbalsamo.mercadoapp.exception.RecursoNoEncontradoException;
import com.franbalsamo.mercadoapp.exception.ReglaNegocioException;
import com.franbalsamo.mercadoapp.mapper.StockProductoMapper;
import com.franbalsamo.mercadoapp.model.StockProductoDTO;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class StockProductoService {

    @Autowired
    private StockProductoRepository stockProductoRepository;

    @Autowired
    private StockProductoMapper stockProductoMapper;

    public StockProducto findByProductoAndPlanilla(Producto producto, Planilla planilla){
        return stockProductoRepository.findByProductoAndPlanilla(producto, planilla)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontro el producto en la planilla"));
    }

    @Transactional
    public StockProductoDTO addStock(StockProductoDTO stockProductoDTO, int cantidadAjuste){
        StockProducto stockProducto = stockProductoRepository.findByProductoIdAndPlanillaId(stockProductoDTO.getId_producto(), stockProductoDTO.getId_planilla())
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontro el producto en la planilla"));

        /*
        Planilla planilla = planillaService.findById(stockProductoDTO.getId_planilla());
        Producto producto = productoService.findById(stockProductoDTO.getId_producto());
        StockProducto stockProducto = stockProductoRepository.findByProductoIdAndPlanillaId(producto, planilla)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontro el producto en la planilla"));
        */
        int nuevoStock = stockProducto.getStock() + cantidadAjuste;

        if(nuevoStock < 0){
            throw new ReglaNegocioException("Error: El ajuste dejaria en stock negativo");
        }
        stockProducto.setStock(nuevoStock);

        return stockProductoMapper.toDTO(stockProductoRepository.save(stockProducto));
    }

    @Transactional
    public StockProductoDTO removeStock(StockProductoDTO stockProductoDTO, int cantidadAjuste){
        StockProducto stockProducto = stockProductoRepository.findByProductoIdAndPlanillaId(stockProductoDTO.getId_producto(), stockProductoDTO.getId_planilla())
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontro el producto en la planilla"));
        /*
        Planilla planilla = planillaService.findById(stockProductoDTO.getId_planilla());
        Producto producto = productoService.findById(stockProductoDTO.getId_producto());

        StockProducto stockDiario = stockProductoRepository.findByProductoAndPlanilla(producto, planilla)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontro el producto en la planilla"));
         */
        int nuevoStock = stockProducto.getStock() - cantidadAjuste;
        if(nuevoStock < 0){
            throw new ReglaNegocioException("Error: El ajuste dejaria en stock negativo");
        }

        stockProducto.setStock(nuevoStock);
        return stockProductoMapper.toDTO(stockProductoRepository.save(stockProducto));
    }

    public StockProducto save(StockProducto stockProducto){
        return stockProductoRepository.save(stockProducto);
    }
}
