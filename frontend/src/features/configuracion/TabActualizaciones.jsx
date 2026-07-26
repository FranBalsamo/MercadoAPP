import { useState } from 'react';
import { HiOutlineArrowPath, HiOutlineCheckCircle, HiOutlineArrowDownTray, HiOutlineDocumentText } from 'react-icons/hi2';
import MensajeError from '@/shared/ui/MensajeError';
import { esTauriApp } from '@/shared/utils/esTauriApp';
import '@/shared/styles/Modal.css';

// Puramente presentacional: el chequeo/instalacion de actualizaciones vive en App.jsx (no
// aca) para que sobreviva a la navegacion — antes, al tener el estado adentro de este tab,
// si el usuario se iba de Configuracion mientras se instalaba (o volvia despues de un rato)
// perdia el progreso y la pestania volvia a "Empresa" por defecto.
function TabActualizaciones({
    versionApp,
    updateDisponible,
    buscandoActualizacion,
    yaSeRevisoActualizacion,
    erroActualizacion,
    buscarActualizaciones,
    instalandoActualizacion,
    progresoInstalacion,
    instalarActualizacion,
}) {
    const [mostrarNotas, setMostrarNotas] = useState(false);

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
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{versionApp || 'Cargando...'}</p>
            </div>

            <button
                className="btn-global btn-primario"
                onClick={buscarActualizaciones}
                disabled={buscandoActualizacion || instalandoActualizacion}
                style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
                <HiOutlineArrowPath />
                {buscandoActualizacion ? 'Buscando...' : 'Buscar actualizaciones'}
            </button>

            <MensajeError mensaje={erroActualizacion} />

            {yaSeRevisoActualizacion && !updateDisponible && !erroActualizacion && (
                <p style={{ color: 'var(--success)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <HiOutlineCheckCircle /> Ya tenés la última versión.
                </p>
            )}

            {updateDisponible && (
                <div style={{ backgroundColor: 'var(--info-soft)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '15px' }}>
                    <p style={{ margin: '0 0 15px 0', fontWeight: 'bold', color: 'var(--info-soft-text)' }}>
                        Hay una versión nueva disponible: {updateDisponible.version}
                    </p>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {updateDisponible.body && (
                            <button
                                type="button"
                                className="btn-global btn-secundario"
                                onClick={() => setMostrarNotas(true)}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                <HiOutlineDocumentText />
                                Ver cambios
                            </button>
                        )}
                        <button
                            className="btn-global btn-primario-green"
                            onClick={instalarActualizacion}
                            disabled={instalandoActualizacion}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <HiOutlineArrowDownTray />
                            {instalandoActualizacion ? `Instalando... ${progresoInstalacion}%` : 'Instalar y reiniciar'}
                        </button>
                    </div>
                </div>
            )}

            {mostrarNotas && updateDisponible?.body && (
                <div className="modal-overlay">
                    <div className="modal-contenido" style={{ width: '95%', maxWidth: '520px', maxHeight: '80vh' }}>
                        <div className="modal-header">
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <HiOutlineDocumentText /> Novedades de la versión {updateDisponible.version}
                            </h3>
                            <button className="btn-cerrar-modal" onClick={() => setMostrarNotas(false)}>X</button>
                        </div>
                        <div className="modal-body">
                            <p style={{ margin: 0, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                                {updateDisponible.body}
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-global btn-primario" onClick={() => setMostrarNotas(false)}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TabActualizaciones;
