package com.franbalsamo.mercadoapp.Controller;

import com.franbalsamo.mercadoapp.Service.ClienteService;
import com.franbalsamo.mercadoapp.Model.DTO.ClienteDTO;
import com.franbalsamo.mercadoapp.Model.DTO.ClienteDeudorDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/clientes")
@CrossOrigin(origins = "*") //@CrossOrigin es crucial para que el frontend se conecte sin bloqueos!
public class ClienteController {

    @Autowired
    private ClienteService clienteService;

    @PostMapping("/new")
    public ResponseEntity<ClienteDTO> newCliente(@RequestBody ClienteDTO clienteDTO){
        if(clienteService.existsByDocumento(clienteDTO.getDocumento())){
            return new ResponseEntity<>(HttpStatus.CONFLICT);
        }

        ClienteDTO clienteNuevo = clienteService.saveCliente(clienteDTO);
        return new ResponseEntity<>(clienteNuevo, HttpStatus.CREATED); //Codigo de created: 201
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClienteDTO> modificarCliente(@PathVariable Long id, @RequestBody ClienteDTO clienteDTO){
        clienteDTO.setId(id);
        ClienteDTO clienteActualizado = clienteService.modificarCliente(clienteDTO);
        return new ResponseEntity<>(clienteActualizado, HttpStatus.OK);
    }

    @GetMapping("/All")
    public ResponseEntity<List<ClienteDTO>> findAll(){
        List<ClienteDTO> listaClientes = clienteService.findAll();
        return new ResponseEntity<>(listaClientes,HttpStatus.OK);
    }

    @GetMapping("All/{FiltroNombre}")
    public ResponseEntity<List<ClienteDTO>> findAllByNombre(@PathVariable String FiltroNombre){
        List<ClienteDTO> listaClientes = clienteService.findAllByFiltroNombre(FiltroNombre);
        return new ResponseEntity<>(listaClientes,HttpStatus.OK);
    }

    @GetMapping("/buscar/documento/{documento}")
    public ResponseEntity<ClienteDTO> findByDocumento(@PathVariable String documento) {
        ClienteDTO clienteEncontrado = clienteService.findByDocumento(documento);
        return new ResponseEntity<>(clienteEncontrado, HttpStatus.OK);
    }

    @GetMapping("/buscar/nombre/{nombre}")
    public ResponseEntity<ClienteDTO> findByNombre(@PathVariable String nombre) {
        ClienteDTO clienteEncontrado = clienteService.findByNombre(nombre);
        return new ResponseEntity<>(clienteEncontrado, HttpStatus.OK);
    }

    @GetMapping("/deudores/{cantidad}")
    public ResponseEntity<List<ClienteDeudorDTO>> findTopDeudores(@PathVariable int cantidad) {
        List<ClienteDeudorDTO> topDeudores = clienteService.findTopDeudores(cantidad);
        return new ResponseEntity<>(topDeudores, HttpStatus.OK);
    }
}
