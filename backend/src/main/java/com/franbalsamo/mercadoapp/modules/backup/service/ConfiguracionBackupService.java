package com.franbalsamo.mercadoapp.modules.backup.service;

import com.franbalsamo.mercadoapp.modules.backup.model.ConfiguracionBackup;
import com.franbalsamo.mercadoapp.modules.backup.model.ConfiguracionBackupDTO;
import com.franbalsamo.mercadoapp.modules.backup.repository.ConfiguracionBackupRepository;
import com.franbalsamo.mercadoapp.shared.exception.ReglaNegocioException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Service;

@Service
public class ConfiguracionBackupService {

    // Valor por defecto de ConfiguracionBackup.rutaDestino: en Docker (perfil != "desktop") es
    // una carpeta relativa valida (montada como volumen), pero en la app instalada (perfil
    // "desktop") significa que el usuario nunca eligio una carpeta real con el selector nativo.
    private static final String RUTA_SIN_CONFIGURAR = "backups";

    @Autowired
    private ConfiguracionBackupRepository configuracionBackupRepository;

    @Autowired
    private ConfiguracionBackupMapper configuracionBackupMapper;

    @Autowired
    private Environment environment;

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
        boolean esAppInstalada = environment.acceptsProfiles(Profiles.of("desktop"));
        if (dto.isActivo() && esAppInstalada && RUTA_SIN_CONFIGURAR.equals(dto.getRutaDestino().trim())) {
            throw new ReglaNegocioException("Elegí una carpeta de destino antes de activar el backup automático.");
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
