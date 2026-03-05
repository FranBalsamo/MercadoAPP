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

        Planilla planillaGuardada = planillaRepository.save(planillaNueva);
        PlanillaDTO responseDTO = modelMapper.map(planillaGuardada, PlanillaDTO.class);

        List<StockProducto> entidadesStock = planillaGuardada.getStockProductos();
        List<StockProductoDTO> dtosStock = responseDTO.getStockProductos();

        for(int i = 0; i < entidadesStock.size(); i++){
            StockProducto entidad = entidadesStock.get(i);
            StockProductoDTO dto = dtosStock.get(i);

            dto.setId_planilla(planillaNueva.getId_planilla());
            dto.setId_producto(entidad.getProducto().getId_producto());
        }

        return responseDTO;
    }

    public Planilla findById(long id){
        return planillaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontro la planilla con id: "+ id));
    }

}
