package com.franbalsamo.mercadoapp.modules.cliente.repository;

import com.franbalsamo.mercadoapp.modules.cliente.TipoCliente;
import com.franbalsamo.mercadoapp.modules.cliente.model.Cliente;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    Optional<Cliente> findByDocumento(String documento);
    // findFirstBy (no findBy) a proposito: 'nombre' no tiene constraint de unicidad, asi que
    // dos clientes con el mismo nombre no deben tirar una excepcion de resultado ambiguo.
    Optional<Cliente> findFirstByNombreOrderByIdAsc(String nombre);
    Optional<Cliente> findById(long id);

    @Query("SELECT c FROM Cliente c WHERE c.nombre LIKE LOWER(CONCAT('%', :nombre, '%'))")
    List<Cliente> findAllByFiltroNombre(@Param("nombre") String nombre);

    // Los 3 filtros son excluyentes entre si en la UI (un solo radio activo a la vez), pero se
    // combinan con AND aca: si alguno viene null, esa condicion se ignora por completo.
    @Query("SELECT c FROM Cliente c WHERE " +
            "(:nombre IS NULL OR c.nombre LIKE LOWER(CONCAT('%', :nombre, '%'))) AND " +
            "(:documento IS NULL OR c.documento LIKE CONCAT('%', :documento, '%')) AND " +
            "(:tipo IS NULL OR c.tipoCliente = :tipo)")
    Page<Cliente> buscarPaginado(@Param("nombre") String nombre, @Param("documento") String documento, @Param("tipo") TipoCliente tipo, Pageable pageable);

    boolean existsByDocumento(String documento);
}
