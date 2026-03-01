package com.franbalsamo.mercadoapp.Service;

import com.franbalsamo.mercadoapp.Repository.ClienteRepository;
import com.franbalsamo.mercadoapp.domain.Cliente;
import com.franbalsamo.mercadoapp.exception.RecursoNoEncontradoException;
import com.franbalsamo.mercadoapp.model.ClienteDTO;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ClienteService {
    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private ModelMapper modelMapper;

    public ClienteDTO saveCliente(ClienteDTO dto){
        Cliente nuevoCliente = modelMapper.map(dto, Cliente.class);
        return modelMapper.map(clienteRepository.save(nuevoCliente), ClienteDTO.class);
    }

    public ClienteDTO modificarCliente(ClienteDTO dto){
        Cliente cliente = clienteRepository.findById(dto.getId_cliente())
                .orElseThrow(() -> new RecursoNoEncontradoException("Cliente no encontrado con id: " + dto.getId_cliente()));

        cliente.setNombre(dto.getNombre());
        cliente.setDocumento(dto.getDocumento());
        cliente.setTelefono(dto.getTelefono());
        cliente.setDireccion(dto.getDireccion());

        return modelMapper.map(clienteRepository.save(cliente),ClienteDTO.class);
    }

    public List<ClienteDTO> findAll(){
        return clienteRepository.findAll().stream()
                .map(cliente -> modelMapper.map(cliente, ClienteDTO.class))
                .toList();
    }

    public Cliente findById(long id){
       return clienteRepository.findById(id)
               .orElseThrow(() -> new RecursoNoEncontradoException("Cliente no encontrado con id: " + id));
    }

    public ClienteDTO findByDocumento(String documento){
        Cliente cliente = clienteRepository.findByDocumento(documento)
                .orElseThrow(() -> new RecursoNoEncontradoException("Cliente no encontrado con documento: " + documento));
        return modelMapper.map(cliente, ClienteDTO.class);
    }

    public ClienteDTO findByNombre(String nombre){
        Cliente cliente = clienteRepository.findByNombre(nombre)
                .orElseThrow(() -> new RecursoNoEncontradoException("Cliente no encontrado con nombre: " + nombre));
        return modelMapper.map(cliente, ClienteDTO.class);
    }
}
