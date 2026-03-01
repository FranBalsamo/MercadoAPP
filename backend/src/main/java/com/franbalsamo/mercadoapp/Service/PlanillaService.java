package com.franbalsamo.mercadoapp.Service;

import com.franbalsamo.mercadoapp.Enum.EstadoPlanilla;
import com.franbalsamo.mercadoapp.Repository.PlanillaRepository;
import com.franbalsamo.mercadoapp.domain.Planilla;
import com.franbalsamo.mercadoapp.exception.RecursoNoEncontradoException;
import com.franbalsamo.mercadoapp.model.PlanillaDTO;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import tools.jackson.databind.cfg.MapperBuilder;

import java.time.LocalDate;
import java.util.Optional;

@Service
public class PlanillaService {
    @Autowired
    public PlanillaRepository planillaRepository;
    @Autowired
    private ModelMapper modelMapper;

    public PlanillaDTO newPlanilla(){
        Planilla planillaNueva = new Planilla(LocalDate.now(), EstadoPlanilla.ABIERTA);
        return modelMapper.map(planillaNueva, PlanillaDTO.class);
    }



    public Planilla findById(long id){
        return planillaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontro la planilla con id: "+ id));
    }

}
