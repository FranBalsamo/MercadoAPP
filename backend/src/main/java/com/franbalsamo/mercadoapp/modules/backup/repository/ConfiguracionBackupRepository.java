package com.franbalsamo.mercadoapp.modules.backup.repository;

import com.franbalsamo.mercadoapp.modules.backup.model.ConfiguracionBackup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConfiguracionBackupRepository extends JpaRepository<ConfiguracionBackup, Long> {
    Optional<ConfiguracionBackup> findFirstByOrderByIdAsc();
}
