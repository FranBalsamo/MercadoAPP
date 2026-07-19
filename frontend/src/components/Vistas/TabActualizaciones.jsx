import { useEffect, useState } from 'react';
import { getVersion } from '@tauri-apps/api/app';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { HiOutlineArrowPath, HiOutlineCheckCircle, HiOutlineArrowDownTray, HiOutlineExclamationTriangle } from 'react-icons/hi2';

const esTauriApp = () => typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__;

function TabActualizaciones() {
    const [versionActual, setVersionActual] = useState('');
    const [buscando, setBuscando] = useState(false);
    const [update, setUpdate] = useState(null);
    const [yaSeReviso, setYaSeReviso] = useState(false);
    const [instalando, setInstalando] = useState(false);
    const [progreso, setProgreso] = useState(0);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!esTauriApp()) return;
        getVersion().then(setVersionActual).catch((err) => console.error('No se pudo leer la versión actual:', err));
    }, []);

    const buscarActualizaciones = async () => {
        setBuscando(true);
        setError('');
        setUpdate(null);
        setYaSeReviso(false);
        try {
            const resultado = await check();
            setUpdate(resultado);
            setYaSeReviso(true);
        } catch (err) {
            console.error('Error al buscar actualizaciones:', err);
            setError('No se pudo conectar con el servidor de actualizaciones. Revisá tu conexión a internet.');
        } finally {
            setBuscando(false);
        }
    };

    const instalarActualizacion = async () => {
        if (!update) return;
        setInstalando(true);
        setError('');
        setProgreso(0);
        try {
            let totalDescargado = 0;
            let tamanioTotal = 0;
            await update.downloadAndInstall((evento) => {
                if (evento.event === 'Started') {
                    tamanioTotal = evento.data.contentLength || 0;
                } else if (evento.event === 'Progress') {
                    totalDescargado += evento.data.chunkLength;
                    if (tamanioTotal > 0) setProgreso(Math.round((totalDescargado / tamanioTotal) * 100));
                } else if (evento.event === 'Finished') {
                    setProgreso(100);
                }
            });
            await relaunch();
        } catch (err) {
            console.error('Error al instalar la actualización:', err);
            setError('Ocurrió un error al descargar o instalar la actualización.');
            setInstalando(false);
        }
    };

    if (!esTauriApp()) {
        return (
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                Las actualizaciones solo se pueden buscar desde la app instalada, no desde el modo de desarrollo.
            </p>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '520px' }}>
            <div>
                <h3 style={{ margin: '0 0 5px 0', color: 'var(--text-primary)' }}>Versión instalada</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{versionActual || 'Cargando...'}</p>
            </div>

            <button
                className="btn-global btn-primario"
                onClick={buscarActualizaciones}
                disabled={buscando || instalando}
                style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
                <HiOutlineArrowPath />
                {buscando ? 'Buscando...' : 'Buscar actualizaciones'}
            </button>

            {error && (
                <p style={{ color: 'var(--danger)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <HiOutlineExclamationTriangle /> {error}
                </p>
            )}

            {yaSeReviso && !update && !error && (
                <p style={{ color: 'var(--success)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <HiOutlineCheckCircle /> Ya tenés la última versión.
                </p>
            )}

            {update && (
                <div style={{ backgroundColor: 'var(--info-soft)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '15px' }}>
                    <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: 'var(--info-soft-text)' }}>
                        Hay una versión nueva disponible: {update.version}
                    </p>
                    {update.body && (
                        <p style={{ margin: '0 0 15px 0', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                            {update.body}
                        </p>
                    )}
                    <button
                        className="btn-global btn-primario-green"
                        onClick={instalarActualizacion}
                        disabled={instalando}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <HiOutlineArrowDownTray />
                        {instalando ? `Instalando... ${progreso}%` : 'Instalar y reiniciar'}
                    </button>
                </div>
            )}
        </div>
    );
}

export default TabActualizaciones;
