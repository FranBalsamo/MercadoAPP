package com.franbalsamo.mercadoapp.modules.backup.service;

import com.franbalsamo.mercadoapp.modules.backup.model.ConfiguracionBackup;
import com.franbalsamo.mercadoapp.modules.backup.model.ConfiguracionBackupDTO;
import org.springframework.stereotype.Component;

@Component
public class ConfiguracionBackupMapper {

    public ConfiguracionBackupDTO toDTO(ConfiguracionBackup configuracion) {
        if (configuracion == null) {
            return null;
        }

        ConfiguracionBackupDTO dto = new ConfiguracionBackupDTO();
        dto.setId(configuracion.getId());
        dto.setActivo(configuracion.isActivo());
        dto.setIntervaloHoras(configuracion.getIntervaloHoras());
        dto.setRutaDestino(configuracion.getRutaDestino());
        dto.setUltimaEjecucion(configuracion.getUltimaEjecucion());
        dto.setUltimoResultado(configuracion.getUltimoResultado());

        return dto;
    }
}
