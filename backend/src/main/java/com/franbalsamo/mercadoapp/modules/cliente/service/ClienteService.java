package com.franbalsamo.mercadoapp.modules.cliente.service;

import com.franbalsamo.mercadoapp.modules.cliente.repository.ClienteRepository;
import com.franbalsamo.mercadoapp.modules.cliente.model.Cliente;
import com.franbalsamo.mercadoapp.modules.cliente.TipoCliente;
import com.franbalsamo.mercadoapp.modules.cliente.TipoDocumento;
import com.franbalsamo.mercadoapp.shared.exception.RecursoNoEncontradoException;
import com.franbalsamo.mercadoapp.shared.exception.ReglaNegocioException;
import com.franbalsamo.mercadoapp.modules.cliente.model.ClienteDTO;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ClienteService {
    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private ClienteMapper clienteMapper;

    public Cliente save(Cliente cliente){
        return clienteRepository.save(cliente);
    }

    // Un SUPERMERCADO siempre factura con CUIT_L: no tiene sentido elegir DNI para ese tipo
    // de cliente, asi que se fuerza aca en vez de confiar en lo que mande el frontend.
    private void forzarTipoDocumentoSegunTipoCliente(ClienteDTO dto){
        if(dto.getTipoCliente() == TipoCliente.SUPERMERCADO){
            dto.setTipoDocumento(TipoDocumento.CUIT_L);
        } else if(dto.getTipoDocumento() == null){
            dto.setTipoDocumento(TipoDocumento.DNI);
        }
    }

    private void validarDirecciones(ClienteDTO dto){
        if(dto.getTipoCliente() == TipoCliente.PERSONA
                && dto.getDirecciones() != null
                && dto.getDirecciones().size() > 1){
            throw new ReglaNegocioException("Un cliente de tipo PERSONA no puede tener mas de una direccion.");
        }
    }

    private List<String> normalizarDirecciones(List<String> direcciones){
        if(direcciones == null){
            return new ArrayList<>();
        }
        List<String> normalizadas = new ArrayList<>();
        for(String direccion : direcciones){
            normalizadas.add(direccion.trim().toLowerCase());
        }
        return normalizadas;
    }

    @Transactional
    public ClienteDTO saveCliente(ClienteDTO dto){
        forzarTipoDocumentoSegunTipoCliente(dto);
        validarDirecciones(dto);
        Cliente nuevoCliente = clienteMapper.toEntity(dto);
        nuevoCliente.setDirecciones(normalizarDirecciones(dto.getDirecciones()));
        return clienteMapper.toDTO(clienteRepository.save(nuevoCliente));
    }

    @Transactional
    public ClienteDTO modificarCliente(ClienteDTO dto){
        forzarTipoDocumentoSegunTipoCliente(dto);
        validarDirecciones(dto);

        Cliente cliente = clienteRepository.findById(dto.getId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Cliente no encontrado con id: " + dto.getId()));

        if(!cliente.getDocumento().equals(dto.getDocumento()) && clienteRepository.existsByDocumento(dto.getDocumento())){
            throw new ReglaNegocioException("Ya existe un cliente registrado con el documento: " + dto.getDocumento());
        }

        cliente.setNombre(dto.getNombre());
        cliente.setDocumento(dto.getDocumento());
        cliente.setTipoDocumento(dto.getTipoDocumento());
        cliente.setTelefono(dto.getTelefono());
        cliente.setTipoCliente(dto.getTipoCliente());

        // No reemplazamos la referencia de la lista: mutamos la coleccion ya gestionada por Hibernate
        // en la misma transaccion, asi el @ElementCollection detecta los cambios y los persiste bien.
        cliente.getDirecciones().clear();
        cliente.getDirecciones().addAll(normalizarDirecciones(dto.getDirecciones()));

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

    @Transactional
    public ClienteDTO modificarSaldo(long id, float nuevoSaldo){
        if(nuevoSaldo < 0){
            throw new ReglaNegocioException("El saldo del cliente no puede ser negativo");
        }

        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Cliente no encontrado con id: " + id));

        cliente.setSaldo_a_favor(nuevoSaldo);

        return clienteMapper.toDTO(clienteRepository.save(cliente));
    }
}
