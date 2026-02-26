package com.franbalsamo.mercadoapp.Controller;

import com.franbalsamo.mercadoapp.Service.ClienteService;
import com.franbalsamo.mercadoapp.domain.Cliente;
import com.franbalsamo.mercadoapp.model.ClienteDTO;
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

    @PostMapping
    public ResponseEntity<Cliente> crearCliente(@RequestBody ClienteDTO clienteDTO){
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

    @GetMapping
    public ResponseEntity<List<Cliente>> findAll(){
        List<Cliente> listaClientes = clienteService.findAll();
        return new ResponseEntity<>(listaClientes,HttpStatus.OK);
    }

    @GetMapping("/documento/{documento}") // La URL será: GET http://localhost:8080/api/clientes/documento/30123456
    public ResponseEntity<Cliente> findByDocumento(@PathVariable String documento) {
        Cliente clienteEncontrado = clienteService.findByDocumento(documento);

        if (clienteEncontrado != null) {
            // Si lo encontró, devuelve el cliente y un código 200 (OK)
            return new ResponseEntity<>(clienteEncontrado, HttpStatus.OK);
        } else {
            // Si devolvió null, significa que ese DNI no está registrado. Devolvemos 404 (Not Found)
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/documento/{nombre}") // La URL será: GET http://localhost:8080/api/clientes/documento/30123456
    public ResponseEntity<Cliente> findByNombre(@PathVariable String nombre) {
        Cliente clienteEncontrado = clienteService.findByNombre(nombre);

        if (clienteEncontrado != null) {
            // Si lo encontró, devuelve el cliente y un código 200 (OK)
            return new ResponseEntity<>(clienteEncontrado, HttpStatus.OK);
        } else {
            // Si devolvió null, significa que ese DNI no está registrado. Devolvemos 404 (Not Found)
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }
}
