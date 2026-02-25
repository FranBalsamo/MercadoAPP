package com.franbalsamo.mercadoapp.Repository;

import com.franbalsamo.mercadoapp.domain.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    Optional<Cliente> findClienteByDocumento(String documento);
}
