import { useState, useRef, useEffect } from 'react';
import { save, open } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { HiOutlineArrowDownTray, HiOutlineArrowUpTray, HiOutlineShieldExclamation, HiOutlineClock, HiOutlineFolderOpen } from 'react-icons/hi2';
import AlertaConfirmacion from '../Alertas/AlertaConfirmacion';

const esTauriApp = () => typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__;

// El backend corre en un contenedor Docker con los discos de Windows montados en /mnt/<letra>
// (ver scripts/refrescar-discos.ps1). El selector nativo de Tauri devuelve una ruta de Windows
// (ej. "D:\Backups"), asi que la traducimos a la ruta equivalente dentro del contenedor.
const rutaWindowsAContenedor = (rutaWindows) => {
    const match = rutaWindows.match(/^([A-Za-z]):[\\/](.*)$/);
    if (!match) return null;
    const letra = match[1].toLowerCase();
    const resto = match[2].replace(/\\/g, '/');
    return `/mnt/${letra}${resto ? '/' + resto : ''}`;
};

const rutaContenedorAWindows = (rutaContenedor) => {
    const match = rutaContenedor.match(/^\/mnt\/([a-zA-Z])(\/.*)?$/);
    if (!match) return null;
    const letra = match[1].toUpperCase();
    const resto = (match[2] || '').replace(/\//g, '\\');
    return `${letra}:${resto}`;
};

function TabBackup() {
    const [exportando, setExportando] = useState(false);
    const [importando, setImportando] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');
    const [archivoAImportar, setArchivoAImportar] = useState(null);
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
    const inputArchivoRef = useRef(null);

    const [configAuto, setConfigAuto] = useState({ activo: false, intervaloHoras: 24, rutaDestino: 'backups', ultimaEjecucion: null, ultimoResultado: null });
    const [cargandoConfig, setCargandoConfig] = useState(true);
    const [guardandoConfig, setGuardandoConfig] = useState(false);
    const [mensajeConfig, setMensajeConfig] = useState('');
    const [errorConfig, setErrorConfig] = useState('');

    useEffect(() => {
        const cargarConfig = async () => {
            try {
                const respuesta = await fetch('http://localhost:8080/api/backup/config');
                if (respuesta.ok) {
                    setConfigAuto(await respuesta.json());
                }
            } catch (err) {
                console.error(err);
            } finally {
                setCargandoConfig(false);
            }
        };
        cargarConfig();
    }, []);

    const actualizarCampoConfig = (campo, valor) => {
        setConfigAuto(prev => ({ ...prev, [campo]: valor }));
    };

    const handleElegirCarpeta = async () => {
        setErrorConfig('');
        try {
            const carpetaElegida = await open({ directory: true, multiple: false });
            if (!carpetaElegida) return;

            const rutaContenedor = rutaWindowsAContenedor(carpetaElegida);
            if (!rutaContenedor) {
                setErrorConfig('No se pudo interpretar esa carpeta. Elegí una ubicación dentro de un disco con letra (ej. D:\\...).');
                return;
            }
            actualizarCampoConfig('rutaDestino', rutaContenedor);
        } catch (err) {
            console.error(err);
            setErrorConfig('No se pudo abrir el selector de carpetas.');
        }
    };

    const handleGuardarConfig = async () => {
        setGuardandoConfig(true);
        setErrorConfig('');
        setMensajeConfig('');
        try {
            const respuesta = await fetch('http://localhost:8080/api/backup/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(configAuto),
            });
            if (!respuesta.ok) {
                const detalle = await respuesta.text().catch(() => '');
                setErrorConfig(detalle || 'No se pudo guardar la configuración.');
                return;
            }
            setConfigAuto(await respuesta.json());
            setMensajeConfig('Configuración guardada correctamente.');
        } catch (err) {
            console.error(err);
            setErrorConfig('Error de conexión con el servidor.');
        } finally {
            setGuardandoConfig(false);
        }
    };

    const formatearFechaHora = (valor) => {
        if (!valor) return 'Todavía no se ejecutó ningún backup automático.';
        return new Date(valor).toLocaleString('es-AR', { hour12: false });
    };

    const proximoBackup = () => {
        if (!configAuto.activo) return 'Backup automático desactivado.';
        if (!configAuto.ultimaEjecucion) return 'En la próxima revisión automática.';
        const fecha = new Date(configAuto.ultimaEjecucion);
        fecha.setHours(fecha.getHours() + configAuto.intervaloHoras);
        return fecha.toLocaleString('es-AR', { hour12: false });
    };

    const ultimoBackupFallo = () => (configAuto.ultimoResultado || '').startsWith('ERROR');

    const handleExportar = async () => {
        setExportando(true);
        setError('');
        setMensaje('');
        try {
            const respuesta = await fetch('http://localhost:8080/api/backup/exportar');
            if (!respuesta.ok) {
                setError('No se pudo generar el backup.');
                return;
            }

            const bytes = new Uint8Array(await respuesta.arrayBuffer());
            const nombreArchivo = `mercadoapp_backup_${new Date().toISOString().slice(0, 10)}.sql`;
            const esTauri = typeof window !== 'undefined' && window.__TAURI_INTERNALS__;

            if (!esTauri) {
                const blob = new Blob([bytes], { type: 'application/octet-stream' });
                const url = URL.createObjectURL(blob);
                const enlace = document.createElement('a');
                enlace.href = url;
                enlace.download = nombreArchivo;
                enlace.click();
                URL.revokeObjectURL(url);
                setMensaje(`Backup descargado como "${nombreArchivo}".`);
                return;
            }

            const rutaElegida = await save({
                defaultPath: nombreArchivo,
                filters: [{ name: 'SQL', extensions: ['sql'] }],
            });
            if (!rutaElegida) return;

            await writeFile(rutaElegida, bytes);
            setMensaje(`Backup exportado correctamente en: ${rutaElegida}`);
        } catch (err) {
            console.error(err);
            setError('Error de conexión con el servidor.');
        } finally {
            setExportando(false);
        }
    };

    const handleSeleccionarArchivo = (e) => {
        const archivo = e.target.files?.[0];
        if (!archivo) return;
        setArchivoAImportar(archivo);
        setMostrarConfirmacion(true);
    };

    const cancelarImportacion = () => {
        setMostrarConfirmacion(false);
        setArchivoAImportar(null);
        if (inputArchivoRef.current) inputArchivoRef.current.value = '';
    };

    const confirmarImportacion = async () => {
        if (!archivoAImportar) return;
        setMostrarConfirmacion(false);
        setImportando(true);
        setError('');
        setMensaje('');

        try {
            const formData = new FormData();
            formData.append('archivo', archivoAImportar);

            const respuesta = await fetch('http://localhost:8080/api/backup/importar', {
                method: 'POST',
                body: formData,
            });

            if (!respuesta.ok) {
                setError('No se pudo restaurar el backup. Verificá que el archivo sea válido.');
                return;
            }

            setMensaje('Backup restaurado correctamente. Es recomendable reiniciar la aplicación.');
        } catch (err) {
            console.error(err);
            setError('Error de conexión con el servidor.');
        } finally {
            setImportando(false);
            setArchivoAImportar(null);
            if (inputArchivoRef.current) inputArchivoRef.current.value = '';
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', maxWidth: '700px' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                <HiOutlineShieldExclamation /> Copia de Seguridad
            </h3>

            {error && <div style={{ color: 'var(--danger)', fontWeight: 'bold', fontSize: '0.9rem' }}>{error}</div>}
            {mensaje && <div style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '0.9rem' }}>{mensaje}</div>}

            <div style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '18px 20px' }}>
                <h4 style={{ margin: '0 0 6px 0', color: 'var(--text-primary)' }}>Exportar datos</h4>
                <p style={{ margin: '0 0 12px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Descarga un archivo con una copia completa de todos los datos guardados (clientes, productos, planillas, boletas, etc.).
                </p>
                <button className="btn-global btn-primario" onClick={handleExportar} disabled={exportando} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <HiOutlineArrowDownTray /> {exportando ? 'Generando...' : 'Exportar Backup'}
                </button>
            </div>

            <div style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '18px 20px' }}>
                <h4 style={{ margin: '0 0 6px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <HiOutlineClock /> Backup Automático
                </h4>
                <p style={{ margin: '0 0 14px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Genera una copia periódica en el servidor, sin que tengas que hacer nada.
                </p>
                {!esTauriApp() && (
                    <p style={{ margin: '0 0 14px 0', color: 'var(--text-muted)', fontSize: '0.85rem', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
                        ℹ️ El selector de carpeta solo está disponible en la aplicación instalada.
                    </p>
                )}

                {cargandoConfig ? (
                    <p style={{ color: 'var(--text-muted)' }}>Cargando...</p>
                ) : (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontWeight: 'bold' }}>
                            <input
                                id="checkbox_backup_auto"
                                type="checkbox"
                                checked={configAuto.activo}
                                onChange={(e) => actualizarCampoConfig('activo', e.target.checked)}
                            />
                            <label htmlFor="checkbox_backup_auto" style={{ cursor: 'pointer' }}>Activar backup automático</label>
                        </div>

                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '12px' }}>
                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Cada cuántas horas:</label>
                                <input
                                    type="number" min="1" step="1"
                                    value={configAuto.intervaloHoras}
                                    onChange={(e) => actualizarCampoConfig('intervaloHoras', Number(e.target.value) || 1)}
                                    style={{ width: '100px', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', outline: 'none' }}
                                />
                            </div>
                            <div style={{ flex: 1, minWidth: '260px' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Carpeta de destino:</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        value={rutaContenedorAWindows(configAuto.rutaDestino) || configAuto.rutaDestino}
                                        onChange={(e) => actualizarCampoConfig('rutaDestino', e.target.value)}
                                        readOnly={esTauriApp()}
                                        style={{ flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', backgroundColor: esTauriApp() ? 'var(--surface-2)' : 'var(--surface)', color: 'var(--text-primary)', outline: 'none' }}
                                    />
                                    {esTauriApp() && (
                                        <button
                                            type="button"
                                            className="btn-global btn-secundario"
                                            onClick={handleElegirCarpeta}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                                            title="Elegir carpeta"
                                        >
                                            <HiOutlineFolderOpen /> Elegir...
                                        </button>
                                    )}
                                </div>
                                {esTauriApp() && (
                                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                        Si conectaste un disco nuevo y no aparece, reiniciá la aplicación.
                                    </p>
                                )}
                            </div>
                        </div>

                        <p style={{ margin: '0 0 4px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            Última ejecución: {formatearFechaHora(configAuto.ultimaEjecucion)}
                        </p>
                        <p style={{ margin: '0 0 12px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            Próximo backup automático: {proximoBackup()}
                        </p>
                        {ultimoBackupFallo() && (
                            <p style={{ margin: '0 0 12px 0', color: 'var(--danger)', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                ⚠️ El último backup automático no se pudo generar. Verificá la carpeta de destino.
                            </p>
                        )}

                        {errorConfig && <div style={{ color: 'var(--danger)', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '10px' }}>{errorConfig}</div>}
                        {mensajeConfig && <div style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '10px' }}>{mensajeConfig}</div>}

                        <button className="btn-global btn-primario-green" onClick={handleGuardarConfig} disabled={guardandoConfig}>
                            {guardandoConfig ? 'Guardando...' : 'Guardar Configuración'}
                        </button>
                    </>
                )}
            </div>

            <div style={{ backgroundColor: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', padding: '18px 20px' }}>
                <h4 style={{ margin: '0 0 6px 0', color: 'var(--danger-soft-text)' }}>Importar datos</h4>
                <p style={{ margin: '0 0 12px 0', color: 'var(--danger-soft-text)', fontSize: '0.9rem' }}>
                    ⚠️ Restaurar un backup <strong>reemplaza todos los datos actuales</strong> por los del archivo elegido. Esta acción no se puede deshacer.
                </p>
                <label className="btn-global btn-secundario" style={{ cursor: importando ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <HiOutlineArrowUpTray /> {importando ? 'Restaurando...' : 'Importar Backup'}
                    <input
                        ref={inputArchivoRef}
                        type="file"
                        accept=".sql"
                        onChange={handleSeleccionarArchivo}
                        disabled={importando}
                        style={{ display: 'none' }}
                    />
                </label>
            </div>

            {mostrarConfirmacion && (
                <AlertaConfirmacion
                    mensaje={`¿Reemplazar todos los datos actuales por "${archivoAImportar?.name}"?\nEsta acción no se puede deshacer.`}
                    onConfirmar={confirmarImportacion}
                    onCancelar={cancelarImportacion}
                />
            )}
        </div>
    );
}

export default TabBackup;
