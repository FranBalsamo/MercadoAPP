package com.franbalsamo.mercadoapp.modules.backup.service;

import com.franbalsamo.mercadoapp.modules.backup.model.ConfiguracionBackup;
import com.franbalsamo.mercadoapp.modules.backup.repository.ConfiguracionBackupRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class BackupSchedulerService {

    private static final Logger log = LoggerFactory.getLogger(BackupSchedulerService.class);
    private static final DateTimeFormatter FORMATO_ARCHIVO = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");

    @Autowired
    private ConfiguracionBackupRepository configuracionBackupRepository;

    @Autowired
    private BackupService backupService;

    // Revisa cada 10 minutos si corresponde generar un backup automatico segun la
    // configuracion guardada (activo + intervaloHoras desde la ultima ejecucion).
    @Scheduled(fixedRate = 10 * 60 * 1000)
    public void revisarYEjecutarBackupAutomatico() {
        ConfiguracionBackup configuracion = configuracionBackupRepository.findFirstByOrderByIdAsc().orElse(null);
        if (configuracion == null || !configuracion.isActivo()) {
            return;
        }

        LocalDateTime ahora = LocalDateTime.now();
        LocalDateTime proximaEjecucion = configuracion.getUltimaEjecucion() != null
                ? configuracion.getUltimaEjecucion().plusHours(configuracion.getIntervaloHoras())
                : ahora;

        if (ahora.isBefore(proximaEjecucion)) {
            return;
        }

        ejecutarBackup(configuracion);
    }

    private void ejecutarBackup(ConfiguracionBackup configuracion) {
        String nombreArchivo = "mercadoapp_backup_auto_" + LocalDateTime.now().format(FORMATO_ARCHIVO) + ".sql";

        try {
            Path carpetaDestino = Path.of(configuracion.getRutaDestino());
            Files.createDirectories(carpetaDestino);

            String sql = backupService.generarBackup();
            Path archivoDestino = carpetaDestino.resolve(nombreArchivo);
            Files.writeString(archivoDestino, sql, StandardCharsets.UTF_8);

            configuracion.setUltimoResultado("OK: " + archivoDestino);
            // Solo se actualiza en exito: si se actualizara siempre, un fallo esperaria el
            // intervalo completo (ej. 24hs) para el proximo intento. Dejandola sin tocar,
            // la proxima revision (10 min) vuelve a ver la ejecucion como "vencida" y reintenta.
            configuracion.setUltimaEjecucion(LocalDateTime.now());
            log.info("Backup automático generado en {}", archivoDestino);
        } catch (IOException | RuntimeException e) {
            configuracion.setUltimoResultado("ERROR: " + e.getMessage());
            log.error("Error al generar el backup automático", e);
        }
        configuracionBackupRepository.save(configuracion);
    }
}
