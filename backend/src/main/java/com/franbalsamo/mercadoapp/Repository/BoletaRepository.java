package com.franbalsamo.mercadoapp.Repository;

import com.franbalsamo.mercadoapp.domain.Boleta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BoletaRepository extends JpaRepository<Boleta, Long> {
}
