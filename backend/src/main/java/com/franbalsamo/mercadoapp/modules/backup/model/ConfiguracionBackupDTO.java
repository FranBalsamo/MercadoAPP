package com.franbalsamo.mercadoapp.modules.backup.model;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class ConfiguracionBackupDTO {
    private long id;
    private boolean activo;
    private int intervaloHoras;
    private String rutaDestino;
    private LocalDateTime ultimaEjecucion;
    private String ultimoResultado;
}
