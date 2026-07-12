package com.franbalsamo.mercadoapp.modules.stockproducto.service;

import com.franbalsamo.mercadoapp.modules.stockproducto.repository.StockProductoRepository;
import com.franbalsamo.mercadoapp.modules.planilla.model.Planilla;
import com.franbalsamo.mercadoapp.modules.producto.model.Producto;
import com.franbalsamo.mercadoapp.modules.stockproducto.model.StockProducto;
import com.franbalsamo.mercadoapp.shared.exception.RecursoNoEncontradoException;
import com.franbalsamo.mercadoapp.shared.exception.ReglaNegocioException;
import com.franbalsamo.mercadoapp.modules.producto.service.ProductoService;
import com.franbalsamo.mercadoapp.modules.planilla.service.PlanillaService;
import com.franbalsamo.mercadoapp.modules.stockproducto.model.StockProductoDTO;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class StockProductoService {

    @Autowired
    private StockProductoRepository stockProductoRepository;

    @Autowired
    private ProductoService productoService;

    @Autowired
    private PlanillaService planillaService;

    @Autowired
    private StockProductoMapper stockProductoMapper;

    @Transactional
    public StockProductoDTO addStock(StockProductoDTO stockProductoDTO){
        boolean yaExiste = stockProductoRepository
                .findByProductoIdAndPlanillaId(stockProductoDTO.getId_producto(), stockProductoDTO.getId_planilla())
                .isPresent();
        if(yaExiste){
            throw new ReglaNegocioException("El producto ya existe en la planilla");
        }

        Producto producto = productoService.findById(stockProductoDTO.getId_producto());
        Planilla planilla = planillaService.findById(stockProductoDTO.getId_planilla());
        StockProducto stockProductoNuevo = stockProductoMapper.toEntity(stockProductoDTO);
        stockProductoNuevo.setProducto(producto);
        stockProductoNuevo.setPlanilla(planilla);
        return stockProductoMapper.toDTO(stockProductoRepository.save(stockProductoNuevo));
    }
    @Transactional
    public List<StockProductoDTO> updateStocks (List<StockProductoDTO> listaStockProductoDTO){

        for(StockProductoDTO stocKProductoDTO : listaStockProductoDTO){
            if(stocKProductoDTO.getStock() < 0){
                throw new ReglaNegocioException("Error: El inventario no puede ser negativo");
            }
        }

        List<StockProducto> listaStockProductoActualizados = new ArrayList<>();
        for(StockProductoDTO stockProductoDTO : listaStockProductoDTO){
            StockProducto stockProducto = stockProductoRepository.findByProductoIdAndPlanillaId
                    (stockProductoDTO.getId_producto(),stockProductoDTO.getId_planilla()).orElseThrow(() -> new RecursoNoEncontradoException("No se encontro el producto en la planilla"));
            stockProducto.setStock(stockProductoDTO.getStock());
            //stockProductoRepository.save(stockProducto);
            //No necesitamos guardarlo nosotros porque @Transactional lo hace por nosotros al momento de modificar el stock (investigar sobre @Transactional).
            listaStockProductoActualizados.add(stockProducto);
        }

        return listaStockProductoActualizados.stream().map(stockProductoMapper::toDTO).toList();
    }

    public void delete(long id_stockProducto){
        StockProducto stock = stockProductoRepository.findById(id_stockProducto)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontro el producto en la planilla"));
        if(stock.getStock_vendido() != 0){
            throw new ReglaNegocioException("No se puede eliminar el producto porque ya ha sido vendido al menos una vez");
        }
        stockProductoRepository.deleteById(id_stockProducto);
    }
    public StockProducto findByProductoAndPlanilla(Producto producto, Planilla planilla){
        return stockProductoRepository.findByProductoAndPlanilla(producto, planilla)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontro el producto en la planilla"));
    }
}
