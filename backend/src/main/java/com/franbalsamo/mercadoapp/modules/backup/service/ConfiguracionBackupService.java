package com.franbalsamo.mercadoapp.modules.backup.service;

import com.franbalsamo.mercadoapp.modules.backup.model.ConfiguracionBackup;
import com.franbalsamo.mercadoapp.modules.backup.model.ConfiguracionBackupDTO;
import com.franbalsamo.mercadoapp.modules.backup.repository.ConfiguracionBackupRepository;
import com.franbalsamo.mercadoapp.shared.exception.ReglaNegocioException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ConfiguracionBackupService {

    @Autowired
    private ConfiguracionBackupRepository configuracionBackupRepository;

    @Autowired
    private ConfiguracionBackupMapper configuracionBackupMapper;

    // Solo existe una fila de configuracion; si todavia no fue configurada se crea con los valores por defecto.
    public ConfiguracionBackupDTO getConfiguracion() {
        ConfiguracionBackup configuracion = configuracionBackupRepository.findFirstByOrderByIdAsc()
                .orElseGet(() -> configuracionBackupRepository.save(new ConfiguracionBackup()));
        return configuracionBackupMapper.toDTO(configuracion);
    }

    public ConfiguracionBackupDTO actualizarConfiguracion(ConfiguracionBackupDTO dto) {
        if (dto.getIntervaloHoras() < 1) {
            throw new ReglaNegocioException("El intervalo del backup automático debe ser de al menos 1 hora.");
        }
        if (dto.getRutaDestino() == null || dto.getRutaDestino().isBlank()) {
            throw new ReglaNegocioException("La ruta de destino del backup automático no puede estar vacía.");
        }

        ConfiguracionBackup configuracion = configuracionBackupRepository.findFirstByOrderByIdAsc()
                .orElseGet(ConfiguracionBackup::new);

        configuracion.setActivo(dto.isActivo());
        configuracion.setIntervaloHoras(dto.getIntervaloHoras());
        configuracion.setRutaDestino(dto.getRutaDestino().trim());

        ConfiguracionBackup guardada = configuracionBackupRepository.save(configuracion);
        return configuracionBackupMapper.toDTO(guardada);
    }
}
