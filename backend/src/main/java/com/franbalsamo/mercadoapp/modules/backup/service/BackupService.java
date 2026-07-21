package com.franbalsamo.mercadoapp.modules.backup.service;

import com.franbalsamo.mercadoapp.shared.exception.ReglaNegocioException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class BackupService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final String QUERY_TABLAS =
        "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'";

    // Genera un dump de TODA la base actual: por cada tabla, un DELETE seguido de sus INSERT.
    // Se envuelve en SET FOREIGN_KEY_CHECKS para no depender del orden entre tablas relacionadas.
    // @Transactional(readOnly) para que todas las lecturas vean una unica foto consistente de
    // la base (sino, una venta que se procesa mientras se genera el backup puede dejar un dump
    // con tablas relacionadas desincronizadas entre si).
    @Transactional(readOnly = true)
    public String generarBackup() {
        List<String> tablas = jdbcTemplate.queryForList(QUERY_TABLAS, String.class);

        StringBuilder sql = new StringBuilder();
        sql.append("SET FOREIGN_KEY_CHECKS=0;\n");

        for (String tabla : tablas) {
            sql.append("DELETE FROM `").append(tabla).append("`;\n");
        }

        for (String tabla : tablas) {
            List<Map<String, Object>> filas = jdbcTemplate.queryForList("SELECT * FROM `" + tabla + "`");
            for (Map<String, Object> fila : filas) {
                String columnas = fila.keySet().stream()
                        .map(columna -> "`" + columna + "`")
                        .collect(Collectors.joining(", "));
                String valores = fila.values().stream()
                        .map(this::formatearValorSql)
                        .collect(Collectors.joining(", "));
                sql.append("INSERT INTO `").append(tabla).append("` (").append(columnas)
                        .append(") VALUES (").append(valores).append(");\n");
            }
        }

        sql.append("SET FOREIGN_KEY_CHECKS=1;\n");
        return sql.toString();
    }

    // Solo se permite exactamente lo que generarBackup() produce (DELETE/INSERT sobre una
    // tabla, y el toggle de FOREIGN_KEY_CHECKS). Sin esto, restaurarBackup ejecutaba CUALQUIER
    // linea del archivo subido como SQL crudo (DROP, ALTER, UPDATE, etc.) contra la base
    // productiva, sin ninguna otra proteccion (no hay autenticacion en este endpoint).
    private static final Pattern PATRON_SET_FK = Pattern.compile("^SET FOREIGN_KEY_CHECKS=[01]$");
    private static final Pattern PATRON_DELETE = Pattern.compile("^DELETE FROM `[A-Za-z0-9_]+`$");
    private static final Pattern PATRON_INSERT = Pattern.compile("^INSERT INTO `[A-Za-z0-9_]+` \\(.+\\) VALUES \\(.+\\)$");

    private boolean esSentenciaPermitida(String sentencia) {
        return PATRON_SET_FK.matcher(sentencia).matches()
                || PATRON_DELETE.matcher(sentencia).matches()
                || PATRON_INSERT.matcher(sentencia).matches();
    }

    // Ejecuta un dump generado por generarBackup(): reemplaza TODOS los datos actuales.
    // Cada linea no vacia del archivo es una sentencia SQL completa (ver formatearValorSql,
    // que escapa los saltos de linea dentro de los valores para que esto sea seguro).
    @Transactional
    public void restaurarBackup(String contenidoSql) {
        if (contenidoSql == null || contenidoSql.isBlank()) {
            throw new ReglaNegocioException("El archivo de backup esta vacio o no es valido.");
        }

        // Algunos editores de texto agregan un BOM UTF-8 al re-guardar el archivo; sin
        // limpiarlo, la primera sentencia falla con un error de sintaxis SQL confuso.
        String contenidoLimpio = contenidoSql.startsWith("﻿") ? contenidoSql.substring(1) : contenidoSql;

        String[] lineas = contenidoLimpio.split("\n");
        for (String linea : lineas) {
            String sentencia = linea.trim();
            if (sentencia.isEmpty()) {
                continue;
            }
            if (sentencia.endsWith(";")) {
                sentencia = sentencia.substring(0, sentencia.length() - 1);
            }

            if (!esSentenciaPermitida(sentencia)) {
                throw new ReglaNegocioException("El archivo no es un backup valido de MercadoApp (contiene una sentencia no reconocida). Solo se aceptan archivos generados por 'Exportar Backup'.");
            }

            jdbcTemplate.execute(sentencia);
        }
    }

    private String formatearValorSql(Object valor) {
        if (valor == null) {
            return "NULL";
        }
        if (valor instanceof Number || valor instanceof Boolean) {
            return valor.toString();
        }
        if (valor instanceof byte[] bytes) {
            StringBuilder hex = new StringBuilder("X'");
            for (byte b : bytes) {
                hex.append(String.format("%02X", b));
            }
            hex.append("'");
            return hex.toString();
        }

        String texto = valor.toString()
                .replace("\\", "\\\\")
                .replace("'", "\\'")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
        return "'" + texto + "'";
    }
}
