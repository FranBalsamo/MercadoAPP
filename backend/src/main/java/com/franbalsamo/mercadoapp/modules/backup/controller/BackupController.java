package com.franbalsamo.mercadoapp.modules.backup.controller;

import com.franbalsamo.mercadoapp.modules.backup.model.ConfiguracionBackupDTO;
import com.franbalsamo.mercadoapp.modules.backup.service.BackupService;
import com.franbalsamo.mercadoapp.modules.backup.service.ConfiguracionBackupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/backup")
@CrossOrigin(origins = "*")
public class BackupController {

    @Autowired
    private BackupService backupService;

    @Autowired
    private ConfiguracionBackupService configuracionBackupService;

    @GetMapping("/config")
    public ResponseEntity<ConfiguracionBackupDTO> obtenerConfiguracion() {
        return new ResponseEntity<>(configuracionBackupService.getConfiguracion(), HttpStatus.OK);
    }

    @PutMapping("/config")
    public ResponseEntity<ConfiguracionBackupDTO> actualizarConfiguracion(@RequestBody ConfiguracionBackupDTO dto) {
        return new ResponseEntity<>(configuracionBackupService.actualizarConfiguracion(dto), HttpStatus.OK);
    }

    @GetMapping("/exportar")
    public ResponseEntity<byte[]> exportar() {
        String sql = backupService.generarBackup();
        byte[] contenido = sql.getBytes(StandardCharsets.UTF_8);
        String nombreArchivo = "mercadoapp_backup_" + LocalDate.now() + ".sql";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + nombreArchivo + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(contenido);
    }

    @PostMapping("/importar")
    public ResponseEntity<Void> importar(@RequestParam("archivo") MultipartFile archivo) throws IOException {
        String contenido = new String(archivo.getBytes(), StandardCharsets.UTF_8);
        backupService.restaurarBackup(contenido);
        return new ResponseEntity<>(HttpStatus.OK);
    }
}
