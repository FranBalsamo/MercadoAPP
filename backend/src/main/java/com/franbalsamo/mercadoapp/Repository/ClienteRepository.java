package com.franbalsamo.mercadoapp.Repository;

import com.franbalsamo.mercadoapp.Model.Entity.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    Optional<Cliente> findByDocumento(String documento);
    Optional<Cliente> findByNombre(String nombre);
    Optional<Cliente> findById(long id);

    @Query("SELECT c FROM Cliente c WHERE c.nombre LIKE LOWER(CONCAT('%', :nombre, '%'))")
    List<Cliente> findAllByFiltroNombre(@Param("nombre") String nombre);


    boolean existsByDocumento(String documento);
}
