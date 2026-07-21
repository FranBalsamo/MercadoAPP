package com.franbalsamo.mercadoapp.modules.cobro.service;

import com.franbalsamo.mercadoapp.modules.cliente.model.Cliente;
import com.franbalsamo.mercadoapp.modules.cliente.service.ClienteService;
import com.franbalsamo.mercadoapp.modules.cobro.model.Cobro;
import com.franbalsamo.mercadoapp.modules.cobro.model.CobroDTO;
import com.franbalsamo.mercadoapp.modules.cobro.repository.CobroRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class CobroService {

    @Autowired
    public CobroRepository cobroRepository;

    @Autowired
    public ClienteService clienteService;

    @Autowired
    public CobroMapper cobroMapper;

    public Cobro save(Cobro cobro) {
        return cobroRepository.save(cobro);
    }

    public List<CobroDTO> findAllByCliente(long id_cliente) {
        Cliente cliente = clienteService.findById(id_cliente);
        return cobroRepository.findAllByClienteOrderByFechaDesc(cliente).stream()
                .map(cobroMapper::toDTO)
                .toList();
    }

    public List<CobroDTO> findAllByRangoFechas(LocalDate desde, LocalDate hasta) {
        return cobroRepository.findAllByFechaBetweenOrderByFechaDesc(desde, hasta).stream()
                .map(cobroMapper::toDTO)
                .toList();
    }

    public Page<CobroDTO> findAllByClientePaginado(long id_cliente, Pageable pageable) {
        Cliente cliente = clienteService.findById(id_cliente);
        return cobroRepository.findAllByClienteOrderByFechaDesc(cliente, pageable).map(cobroMapper::toDTO);
    }

    public Page<CobroDTO> findAllByRangoFechasPaginado(LocalDate desde, LocalDate hasta, Pageable pageable) {
        return cobroRepository.findAllByFechaBetweenOrderByFechaDesc(desde, hasta, pageable).map(cobroMapper::toDTO);
    }
}
