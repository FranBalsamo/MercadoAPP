package com.franbalsamo.mercadoapp.Service;

import com.franbalsamo.mercadoapp.Repository.ClienteRepository;
import com.franbalsamo.mercadoapp.domain.Cliente;
import com.franbalsamo.mercadoapp.model.ClienteDTO;
import com.franbalsamo.mercadoapp.model.ClienteDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.List;
import java.util.Optional;

@Service
public class ClienteService {
    @Autowired
    private ClienteRepository clienteRepository;
    public Cliente saveCliente(ClienteDTO dto){
        Cliente nuevoCliente = new Cliente(dto.getDocumento(),dto.getNombre());
        return clienteRepository.save(nuevoCliente);
    }

    public Cliente modificarCliente(long id, ClienteDTO dto){
        Optional<Cliente> clienteOptional = clienteRepository.findById(id);

        if(clienteOptional.isPresent()){
            Cliente cliente = clienteOptional.get();
            cliente.setDocumento(dto.getDocumento());
            cliente.setNombre(dto.getNombre());

            return clienteRepository.save(cliente);
        }
        return null;
    }

    public List<Cliente> findAll(){
        return clienteRepository.findAll();
    }

    public Optional<Cliente> findById(long id){
        return clienteRepository.findById(id);
    }

    public Optional<Cliente> findByDocumento(String documento){
        return clienteRepository.findByDocumento(documento);
    }

    public Optional<Cliente> findByNombre(String nombre){
        return clienteRepository.findByNombre(nombre);
    }
}
