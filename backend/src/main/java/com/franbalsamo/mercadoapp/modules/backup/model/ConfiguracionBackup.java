package com.franbalsamo.mercadoapp.modules.backup.model;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "configuracion_backup")
public class ConfiguracionBackup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column
    private boolean activo = false;

    @Column(name = "intervalo_horas")
    private int intervaloHoras = 24;

    // Ruta dentro del sistema de archivos del backend. En Docker se recomienda que sea
    // "/app/backups" (montado como volumen en docker-compose.yml) para que sobreviva a los reinicios.
    @Column(name = "ruta_destino", length = 500)
    private String rutaDestino = "backups";

    @Column(name = "ultima_ejecucion")
    private LocalDateTime ultimaEjecucion;

    @Column(name = "ultimo_resultado", length = 500)
    private String ultimoResultado;

    public ConfiguracionBackup(){}
}
