package com.franbalsamo.mercadoapp.modules.empresa.repository;

import com.franbalsamo.mercadoapp.modules.empresa.model.Empresa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmpresaRepository extends JpaRepository<Empresa, Long> {
    Optional<Empresa> findFirstByOrderByIdAsc();
}
