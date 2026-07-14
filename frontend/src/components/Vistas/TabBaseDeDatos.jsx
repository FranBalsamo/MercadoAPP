import { useState, useEffect } from 'react';
import { HiOutlineCircleStack, HiOutlineCheckCircle } from 'react-icons/hi2';

function TabBaseDeDatos() {
    const [info, setInfo] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const cargarInfo = async () => {
            try {
                const respuesta = await fetch('http://localhost:8080/api/sistema/db-info');
                if (respuesta.ok) {
                    setInfo(await respuesta.json());
                } else {
                    setError('No se pudo obtener la información de la base de datos.');
                }
            } catch (err) {
                console.error(err);
                setError('Error de conexión con el servidor.');
            } finally {
                setCargando(false);
            }
        };
        cargarInfo();
    }, []);

    const filaStyle = { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' };
    const etiquetaStyle = { color: 'var(--text-secondary)', fontWeight: 'bold' };
    const valorStyle = { color: 'var(--text-primary)', fontFamily: 'monospace', wordBreak: 'break-all', textAlign: 'right', marginLeft: '20px' };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '700px' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                <HiOutlineCircleStack /> Base de Datos
            </h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Todos los datos se guardan de forma local en MySQL. Más adelante vas a poder conectar una base de datos en la nube desde acá.
            </p>

            {cargando && <p style={{ color: 'var(--text-muted)' }}>Cargando...</p>}
            {error && <div style={{ color: 'var(--danger)', fontWeight: 'bold', fontSize: '0.9rem' }}>{error}</div>}

            {info && (
                <div style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '15px 20px' }}>
                    <div style={filaStyle}>
                        <span style={etiquetaStyle}>Estado:</span>
                        <span style={{ ...valorStyle, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <HiOutlineCheckCircle /> Conectada
                        </span>
                    </div>
                    <div style={filaStyle}>
                        <span style={etiquetaStyle}>Motor:</span>
                        <span style={valorStyle}>{info.tipo} (local)</span>
                    </div>
                    <div style={filaStyle}>
                        <span style={etiquetaStyle}>Usuario:</span>
                        <span style={valorStyle}>{info.usuario}</span>
                    </div>
                    <div style={{ ...filaStyle, borderBottom: 'none' }}>
                        <span style={etiquetaStyle}>Conexión:</span>
                        <span style={valorStyle}>{info.url}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TabBaseDeDatos;
