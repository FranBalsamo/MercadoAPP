package com.franbalsamo.mercadoapp.Service;

import com.franbalsamo.mercadoapp.Repository.ClienteRepository;
import com.franbalsamo.mercadoapp.domain.Cliente;
import com.franbalsamo.mercadoapp.exception.RecursoNoEncontradoException;
import com.franbalsamo.mercadoapp.mapper.ClienteMapper;
import com.franbalsamo.mercadoapp.model.ClienteDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ClienteService {
    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private ClienteMapper clienteMapper;

    public ClienteDTO saveCliente(ClienteDTO dto){
        Cliente nuevoCliente = clienteMapper.toEntity(dto);
        return clienteMapper.toDTO(clienteRepository.save(nuevoCliente));
    }

    public ClienteDTO modificarCliente(ClienteDTO dto){
        Cliente cliente = clienteRepository.findById(dto.getId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Cliente no encontrado con id: " + dto.getId()));

        cliente.setNombre(dto.getNombre());
        cliente.setDocumento(dto.getDocumento());
        cliente.setTelefono(dto.getTelefono());
        cliente.setDireccion(dto.getDireccion());

        return clienteMapper.toDTO(clienteRepository.save(cliente));
    }

    public List<ClienteDTO> findAll(){
        return clienteRepository.findAll().stream()
                .map(clienteMapper::toDTO)
                .toList();
    }

    public List<ClienteDTO> findAllByFiltroNombre(String nombre){
        List<Cliente> listaClientes = clienteRepository.findAllByFiltroNombre(nombre);
        return listaClientes.stream()
                .map(clienteMapper::toDTO)
                .toList();
    }

    public Cliente findById(long id){
       return clienteRepository.findById(id)
               .orElseThrow(() -> new RecursoNoEncontradoException("Cliente no encontrado con id: " + id));
    }

    public ClienteDTO findByDocumento(String documento){
        Cliente cliente = clienteRepository.findByDocumento(documento)
                .orElseThrow(() -> new RecursoNoEncontradoException("Cliente no encontrado con documento: " + documento));
        return clienteMapper.toDTO(cliente);
    }

    public ClienteDTO findByNombre(String nombre){
        Cliente cliente = clienteRepository.findByNombre(nombre)
                .orElseThrow(() -> new RecursoNoEncontradoException("Cliente no encontrado con nombre: " + nombre));
        return clienteMapper.toDTO(cliente);
    }

    public boolean existsByDocumento(String documento){
        return clienteRepository.existsByDocumento(documento);
    }
}
