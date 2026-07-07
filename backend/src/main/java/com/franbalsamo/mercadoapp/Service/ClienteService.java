package com.franbalsamo.mercadoapp.Service;

import com.franbalsamo.mercadoapp.Repository.BoletaRepository;
import com.franbalsamo.mercadoapp.Repository.ClienteRepository;
import com.franbalsamo.mercadoapp.Model.Entity.Boleta;
import com.franbalsamo.mercadoapp.Model.Entity.Cliente;
import com.franbalsamo.mercadoapp.Model.DTO.ClienteDeudorDTO;
import com.franbalsamo.mercadoapp.Service.Enum.EstadoPago;
import com.franbalsamo.mercadoapp.Service.Enum.EstadoPlanilla;
import com.franbalsamo.mercadoapp.Service.exception.RecursoNoEncontradoException;
import com.franbalsamo.mercadoapp.Service.exception.ReglaNegocioException;
import com.franbalsamo.mercadoapp.Service.mapper.ClienteMapper;
import com.franbalsamo.mercadoapp.Model.DTO.ClienteDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ClienteService {
    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private BoletaRepository boletaRepository;

    @Autowired
    private ClienteMapper clienteMapper;

    public ClienteDTO saveCliente(ClienteDTO dto){
        Cliente nuevoCliente = clienteMapper.toEntity(dto);
        return clienteMapper.toDTO(clienteRepository.save(nuevoCliente));
    }

    public ClienteDTO modificarCliente(ClienteDTO dto){
        Cliente cliente = clienteRepository.findById(dto.getId())
                .orElseThrow(() -> new RecursoNoEncontradoException("Cliente no encontrado con id: " + dto.getId()));

        if(!cliente.getDocumento().equals(dto.getDocumento()) && clienteRepository.existsByDocumento(dto.getDocumento())){
            throw new ReglaNegocioException("Ya existe un cliente registrado con el documento: " + dto.getDocumento());
        }

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

    public List<ClienteDeudorDTO> findTopDeudores(int cantidad){
        List<Boleta> boletasImpagas = boletaRepository
                .findAllByEstadoPagoAndPlanilla_EstadoPlanilla(EstadoPago.NO_PAGADO, EstadoPlanilla.CERRADA);

        Map<Cliente, Float> deudaPorCliente = new LinkedHashMap<>();
        for (Boleta boleta : boletasImpagas) {
            deudaPorCliente.merge(boleta.getCliente(), boleta.getTotal(), Float::sum);
        }

        return deudaPorCliente.entrySet().stream()
                .sorted(Map.Entry.<Cliente, Float>comparingByValue().reversed())
                .limit(cantidad)
                .map(entry -> new ClienteDeudorDTO(entry.getKey().getId(), entry.getKey().getNombre(), entry.getValue()))
                .toList();
    }
}
