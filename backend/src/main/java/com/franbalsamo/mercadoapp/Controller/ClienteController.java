package com.franbalsamo.mercadoapp.Controller;

import com.franbalsamo.mercadoapp.Service.ClienteService;
import com.franbalsamo.mercadoapp.domain.Cliente;
import com.franbalsamo.mercadoapp.model.ClienteDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/clientes")
@CrossOrigin(origins = "*") //@CrossOrigin es crucial para que el frontend se conecte sin bloqueos!
public class ClienteController {

    @Autowired
    private ClienteService clienteService;

    @PostMapping
    public ResponseEntity<Cliente> crearCliente(ClienteDTO clienteDTO){
        Cliente clienteNuevo = clienteService.saveCliente(clienteDTO);
        return new ResponseEntity<>(clienteNuevo, HttpStatus.CREATED); //Codigo de created: 201
    }

    @PutMapping("/{id}")
    public ResponseEntity<Cliente> modificarCliente(@PathVariable Long id, @RequestBody ClienteDTO clienteDTO){
        Cliente clienteActualizado = clienteService.modificarCliente(id, clienteDTO);
        if(clienteActualizado != null){
            return new ResponseEntity<>(clienteActualizado, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }
}
